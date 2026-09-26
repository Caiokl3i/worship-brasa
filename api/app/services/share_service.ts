import type Membership from '#models/membership'
import Ministry from '#models/ministry'
import Schedule from '#models/schedule'
import { ScheduleNotFoundException } from '#exceptions/ministry_exceptions'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import { effectiveKey } from '#schedules/effective_key'
import {
  renderScheduleImage,
  renderScheduleText,
  resolveShareOptions,
  type SharePerson,
  type ShareRequest,
  type ShareSnapshot,
} from '#schedules/share'

export default class ShareService {
  async text(actor: Membership, scheduleId: string, request: ShareRequest) {
    const snapshot = await this.#snapshot(actor, scheduleId)
    return renderScheduleText(snapshot, resolveShareOptions(request))
  }

  async image(actor: Membership, scheduleId: string) {
    const snapshot = await this.#snapshot(actor, scheduleId)
    return renderScheduleImage(snapshot)
  }

  async #snapshot(actor: Membership, scheduleId: string): Promise<ShareSnapshot> {
    const schedule = await this.#visible(actor, scheduleId)
    const ministry = await Ministry.findOrFail(actor.ministryId)
    const startsAt = schedule.startsAt.toISO()
    if (!startsAt) {
      throw new ScheduleNotFoundException()
    }

    const participants: SharePerson[] = schedule.participants.map((participant) => ({
      membershipId: participant.membershipId,
      name: participant.membership.user.name,
      confirmation: confirmationOf(participant.confirmation),
      functions: participant.assignments
        .map((assignment) => ({
          name: assignment.function.name,
          sortOrder: assignment.function.sortOrder,
        }))
        .sort(
          (left, right) =>
            left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'pt')
        ),
    }))

    return {
      zone: ministry.timezone,
      ministryName: ministry.name,
      ministryColor: ministry.color,
      title: schedule.title,
      startsAt,
      endsAt: schedule.endsAt?.toISO() ?? null,
      notes: schedule.notes,
      dressCode: schedule.dressCode,
      viewerManages: new MembershipAccessService().managesSchedules(actor),
      viewerMembershipId: actor.id,
      participants,
      songs: schedule.songs.map((scheduleSong) => ({
        title: scheduleSong.song.title,
        effectiveKey: effectiveKey({
          keyOverride: scheduleSong.keyOverride,
          versionKey: scheduleSong.versionId ? scheduleSong.version.key : null,
          defaultKey: scheduleSong.song.defaultKey,
        }),
        notes: scheduleSong.notes,
        links: scheduleSong.song.links
          .filter((link) => link.versionId === null || link.versionId === scheduleSong.versionId)
          .map((link) => ({ url: link.url })),
      })),
    }
  }

  async #visible(actor: Membership, scheduleId: string) {
    if (!isUuid(scheduleId)) {
      throw new ScheduleNotFoundException()
    }

    const schedule = await Schedule.query()
      .where('id', scheduleId)
      .where('ministryId', actor.ministryId)
      .whereNull('deletedAt')
      .first()

    if (!schedule) {
      throw new ScheduleNotFoundException()
    }
    if (schedule.status === 'draft' && !new MembershipAccessService().managesSchedules(actor)) {
      throw new ScheduleNotFoundException()
    }

    await schedule.load('participants')
    for (const participant of schedule.participants) {
      await participant.load('membership')
      await participant.membership.load('user')
      await participant.load('assignments')
      for (const assignment of participant.assignments) {
        await assignment.load('function')
      }
    }
    await schedule.load('songs', (songs) => songs.orderBy('position', 'asc'))
    for (const scheduleSong of schedule.songs) {
      await scheduleSong.load('song')
      await scheduleSong.song.load('links')
      if (scheduleSong.versionId) {
        await scheduleSong.load('version')
      }
    }

    schedule.participants.sort((left, right) =>
      left.membership.user.name.localeCompare(right.membership.user.name, 'pt')
    )
    return schedule
  }
}

function confirmationOf(value: string): SharePerson['confirmation'] {
  if (value === 'confirmed' || value === 'declined') {
    return value
  }
  return 'pending'
}

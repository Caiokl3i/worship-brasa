import type Schedule from '#models/schedule'
import type Membership from '#models/membership'
import { effectiveKey } from '#schedules/effective_key'
import type { Conflict } from '#schedules/conflicts'
import MembershipAccessService from '#services/membership_access_service'

export function toScheduleSummary(schedule: Schedule) {
  return {
    id: schedule.id,
    title: schedule.title,
    startsAt: schedule.startsAt.toUTC().toISO(),
    endsAt: schedule.endsAt?.toUTC().toISO() ?? null,
    status: schedule.status,
  }
}

export function toScheduleDetail(
  schedule: Schedule,
  actor: Membership,
  conflicts: Map<string, Conflict[]>
) {
  const manages = new MembershipAccessService().managesSchedules(actor)
  return {
    ...toScheduleSummary(schedule),
    notes: schedule.notes,
    dressCode: schedule.dressCode,
    confirmationRequired: schedule.confirmationRequired,
    version: schedule.version,
    participants: schedule.participants.map((participant) => ({
      id: participant.id,
      membershipId: participant.membershipId,
      name: participant.membership.user.name,
      functions: participant.assignments
        .slice()
        .sort(
          (left, right) =>
            left.function.sortOrder - right.function.sortOrder ||
            left.function.name.localeCompare(right.function.name, 'pt')
        )
        .map((assignment) => ({
          id: assignment.function.id,
          name: assignment.function.name,
          archived: assignment.function.archivedAt !== null,
        })),
      confirmation:
        manages || participant.membershipId === actor.id ? participant.confirmation : null,
      absent: manages || participant.membershipId === actor.id ? participant.absent : null,
      conflicts: conflicts.get(participant.membershipId) ?? [],
    })),
    songs: schedule.songs.map((scheduleSong) => {
      const versionKey = scheduleSong.versionId ? scheduleSong.version.key : null
      return {
        id: scheduleSong.id,
        position: scheduleSong.position,
        songId: scheduleSong.songId,
        title: scheduleSong.song.title,
        artist: scheduleSong.song.artist,
        versionId: scheduleSong.versionId,
        versionName: scheduleSong.versionId ? scheduleSong.version.name : null,
        keyOverride: scheduleSong.keyOverride,
        effectiveKey: effectiveKey({
          keyOverride: scheduleSong.keyOverride,
          versionKey,
          defaultKey: scheduleSong.song.defaultKey,
        }),
        notes: scheduleSong.notes,
        durationSeconds: scheduleSong.durationSeconds,
        links: scheduleSong.song.links
          .filter((link) => link.versionId === null || link.versionId === scheduleSong.versionId)
          .map((link) => ({
            id: link.id,
            kind: link.kind,
            label: link.label,
            url: link.url,
          })),
        highlights: scheduleSong.highlights.map((highlight) => {
          const participant = schedule.participants.find(
            (item) => item.id === highlight.participantId
          )
          return {
            membershipId: participant?.membershipId ?? null,
            functionId: highlight.functionId,
          }
        }),
      }
    }),
  }
}

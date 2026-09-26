import { DateTime } from 'luxon'
import type Membership from '#models/membership'
import MembershipModel from '#models/membership'
import Ministry from '#models/ministry'
import Schedule from '#models/schedule'
import type ScheduleParticipant from '#models/schedule_participant'
import type ScheduleSong from '#models/schedule_song'
import { FieldException, ReportNotFoundException } from '#exceptions/ministry_exceptions'
import MembershipAccessService from '#services/membership_access_service'
import { findConflicts } from '#schedules/conflicts'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MONTH_PATTERN = /^\d{4}-\d{2}$/

type ConfirmationCounts = {
  pending: number
  confirmed: number
  declined: number
}

export default class ReportService {
  async overview(actor: Membership) {
    this.#assertManager(actor)
    const zone = await this.#zone(actor.ministryId)
    const today = DateTime.now().setZone(zone)
    const schedules = await this.#published(
      actor.ministryId,
      today.startOf('month').toISODate()!,
      today.endOf('month').toISODate()!,
      zone
    )
    const counts = this.#counts(schedules)
    return {
      schedules: schedules.length,
      participations: counts.participations,
      assignments: counts.assignments,
      confirmations: counts.confirmations,
      absences: counts.absences,
    }
  }

  async report(actor: Membership, from: unknown, to: unknown) {
    this.#assertManager(actor)
    const start = this.#date(from, 'from')
    const end = this.#date(to, 'to')
    if (end < start) {
      throw new FieldException('to', 'O fim precisa ser depois do início.')
    }
    const limit = DateTime.fromISO(start).plus({ months: 12 }).toISODate()!
    if (end > limit) {
      throw new FieldException('to', 'Informe um intervalo de até 12 meses.')
    }

    const zone = await this.#zone(actor.ministryId)
    const ministry = await Ministry.findOrFail(actor.ministryId)
    const schedules = await this.#published(actor.ministryId, start, end, zone)
    const counts = this.#counts(schedules)
    const served = new Set(counts.members.map((member) => member.membershipId))
    const active = await MembershipModel.query()
      .where('ministryId', actor.ministryId)
      .where('status', 'active')
      .preload('user')

    return {
      members: counts.members.map((member) => ({
        membershipId: member.membershipId,
        name: member.name,
        schedules: member.schedules,
        assignments: member.assignments,
      })),
      idle: active
        .filter((member) => !served.has(member.id))
        .map((member) => ({ membershipId: member.id, name: member.user.name }))
        .sort((left, right) => left.name.localeCompare(right.name, 'pt')),
      absences: counts.members
        .filter((member) => member.absences > 0)
        .map((member) => ({
          membershipId: member.membershipId,
          name: member.name,
          count: member.absences,
        }))
        .sort(
          (left, right) => right.count - left.count || left.name.localeCompare(right.name, 'pt')
        ),
      songs: ministry.musicModuleEnabled ? counts.songs : null,
      confirmations: counts.confirmations,
    }
  }

  async panorama(actor: Membership, month: unknown) {
    this.#assertManager(actor)
    if (typeof month !== 'string' || !MONTH_PATTERN.test(month)) {
      throw new FieldException('month', 'Informe o mês no formato AAAA-MM.')
    }
    const zone = await this.#zone(actor.ministryId)
    const cursor = DateTime.fromISO(`${month}-01`, { zone })
    if (!cursor.isValid) {
      throw new FieldException('month', 'Informe o mês no formato AAAA-MM.')
    }

    const schedules = await this.#published(
      actor.ministryId,
      cursor.startOf('month').toISODate()!,
      cursor.endOf('month').toISODate()!,
      zone
    )
    const days = [
      ...new Set(
        schedules.map((schedule) => schedule.startsAt.setZone(zone).toISODate()!).filter(Boolean)
      ),
    ].sort()

    const functions = new Map<string, { functionId: string; name: string; sortOrder: number }>()
    for (const schedule of schedules) {
      for (const participant of schedule.participants) {
        for (const assignment of participant.assignments) {
          if (!functions.has(assignment.functionId)) {
            functions.set(assignment.functionId, {
              functionId: assignment.functionId,
              name: assignment.function.name,
              sortOrder: assignment.function.sortOrder,
            })
          }
        }
      }
    }

    const rows = []
    for (const ministryFunction of [...functions.values()].sort(
      (left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'pt')
    )) {
      const cells = []
      for (const date of days) {
        const people = []
        for (const schedule of schedules) {
          if (schedule.startsAt.setZone(zone).toISODate() !== date) {
            continue
          }
          for (const participant of schedule.participants) {
            const serves = participant.assignments.some(
              (assignment) => assignment.functionId === ministryFunction.functionId
            )
            if (!serves) {
              continue
            }
            const conflicts = await findConflicts(
              participant.membershipId,
              schedule.startsAt,
              schedule.endsAt,
              schedule.id,
              { includeDrafts: true }
            )
            people.push({
              name: participant.membership.user.name,
              scheduleId: schedule.id,
              conflicts: conflicts.map((conflict) => ({ kind: conflict.kind })),
            })
          }
        }
        people.sort((left, right) => left.name.localeCompare(right.name, 'pt'))
        cells.push({ date, people })
      }
      rows.push({
        functionId: ministryFunction.functionId,
        name: ministryFunction.name,
        cells,
      })
    }

    return { month, days, rows }
  }

  #assertManager(actor: Membership) {
    if (!new MembershipAccessService().managesSchedules(actor)) {
      throw new ReportNotFoundException()
    }
  }

  #date(value: unknown, field: 'from' | 'to') {
    if (
      typeof value !== 'string' ||
      !DATE_PATTERN.test(value) ||
      !DateTime.fromISO(value).isValid
    ) {
      throw new FieldException(field, field === 'from' ? 'Informe o início.' : 'Informe o fim.')
    }
    return value
  }

  async #zone(ministryId: string) {
    const ministry = await Ministry.findOrFail(ministryId)
    return ministry.timezone
  }

  async #published(ministryId: string, from: string, to: string, zone: string) {
    const start = DateTime.fromISO(from, { zone }).startOf('day').toUTC()
    const end = DateTime.fromISO(to, { zone }).endOf('day').toUTC()
    return Schedule.query()
      .where('ministryId', ministryId)
      .where('status', 'published')
      .whereNull('deletedAt')
      .where('startsAt', '>=', start.toSQL()!)
      .where('startsAt', '<=', end.toSQL()!)
      .preload('participants', (participants) => {
        participants.preload('membership', (membership) => membership.preload('user'))
        participants.preload('assignments', (assignments) => assignments.preload('function'))
      })
      .preload('songs', (songs) => songs.preload('song'))
  }

  #counts(schedules: Schedule[]) {
    const confirmations: ConfirmationCounts = { pending: 0, confirmed: 0, declined: 0 }
    let participations = 0
    let assignments = 0
    let absences = 0
    const members = new Map<
      string,
      {
        membershipId: string
        name: string
        schedules: number
        assignments: number
        absences: number
      }
    >()
    const songs = new Map<string, { title: string; artist: string | null; count: number }>()

    for (const schedule of schedules) {
      for (const participant of schedule.participants) {
        participations += 1
        assignments += participant.assignments.length
        this.#confirm(confirmations, participant)
        if (participant.absent) {
          absences += 1
        }
        const current = members.get(participant.membershipId) ?? {
          membershipId: participant.membershipId,
          name: participant.membership.user.name,
          schedules: 0,
          assignments: 0,
          absences: 0,
        }
        current.schedules += 1
        current.assignments += participant.assignments.length
        if (participant.absent) {
          current.absences += 1
        }
        members.set(participant.membershipId, current)
      }

      for (const row of schedule.songs) {
        const current = songs.get(row.songId) ?? {
          title: this.#songTitle(row),
          artist: this.#songArtist(row),
          count: 0,
        }
        if (row.titleSnapshot) {
          current.title = row.titleSnapshot
          current.artist = row.artistSnapshot
        }
        current.count += 1
        songs.set(row.songId, current)
      }
    }

    return {
      participations,
      assignments,
      absences,
      confirmations,
      members: [...members.values()].sort(
        (left, right) =>
          right.schedules - left.schedules || left.name.localeCompare(right.name, 'pt')
      ),
      songs: [...songs.values()].sort(
        (left, right) => right.count - left.count || left.title.localeCompare(right.title, 'pt')
      ),
    }
  }

  #confirm(counts: ConfirmationCounts, participant: ScheduleParticipant) {
    if (participant.confirmation === 'confirmed') {
      counts.confirmed += 1
      return
    }
    if (participant.confirmation === 'declined') {
      counts.declined += 1
      return
    }
    counts.pending += 1
  }

  #songTitle(row: ScheduleSong) {
    return row.titleSnapshot ?? row.song?.title ?? 'Música'
  }

  #songArtist(row: ScheduleSong) {
    if (row.titleSnapshot) {
      return row.artistSnapshot
    }
    return row.song?.artist ?? null
  }
}

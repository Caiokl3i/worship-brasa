import { DateTime } from 'luxon'
import Membership from '#models/membership'
import Schedule from '#models/schedule'
import Unavailability from '#models/unavailability'
import { isUuid } from '#services/membership_access_service'

export type ScheduleConflict = {
  kind: 'schedule'
  scheduleId: string
  title: string
  status: 'draft' | 'published'
}

export type UnavailabilityConflict = {
  kind: 'unavailability'
  unavailabilityId: string
}

export type Conflict = ScheduleConflict | UnavailabilityConflict

export function intervalsOverlap(
  leftStart: DateTime,
  leftEnd: DateTime | null,
  rightStart: DateTime,
  rightEnd: DateTime | null
) {
  const leftFinish = leftEnd ?? leftStart
  const rightFinish = rightEnd ?? rightStart
  return (
    leftStart.toMillis() <= rightFinish.toMillis() && rightStart.toMillis() <= leftFinish.toMillis()
  )
}

export function localDates(startsAt: DateTime, endsAt: DateTime | null, zone: string) {
  const start = startsAt.setZone(zone).startOf('day')
  let end = (endsAt ?? startsAt).setZone(zone).startOf('day')
  if (end < start) {
    end = start
  }

  const dates: string[] = []
  let cursor = start
  for (let guard = 0; guard < 370 && cursor <= end; guard++) {
    const iso = cursor.toISODate()
    if (iso) {
      dates.push(iso)
    }
    cursor = cursor.plus({ days: 1 })
  }
  return dates
}

export function periodCoversDate(startsOn: string, endsOn: string, day: string) {
  return day >= startsOn && day <= endsOn
}

export function scheduleHasEnded(
  startsAt: DateTime,
  endsAt: DateTime | null,
  now = DateTime.utc()
) {
  const deadline = endsAt ?? startsAt
  return now.toMillis() >= deadline.toMillis()
}

export async function findConflicts(
  membershipId: string,
  startsAt: DateTime,
  endsAt: DateTime | null,
  ignoreScheduleId: string | null,
  options: { includeDrafts: boolean }
): Promise<Conflict[]> {
  const membership = await Membership.query().where('id', membershipId).preload('ministry').first()
  if (!membership) {
    return []
  }

  const schedulesQuery = Schedule.query()
    .where('ministryId', membership.ministryId)
    .whereNull('deletedAt')
    .whereHas('participants', (participants) => {
      participants.where('membershipId', membershipId)
    })
    .where((query) => {
      query.where('status', 'published')
      if (options.includeDrafts) {
        query.orWhere('status', 'draft')
      }
    })

  if (ignoreScheduleId && isUuid(ignoreScheduleId)) {
    schedulesQuery.whereNot('id', ignoreScheduleId)
  }

  const schedules = await schedulesQuery

  const conflicts: Conflict[] = schedules
    .filter((schedule) => intervalsOverlap(startsAt, endsAt, schedule.startsAt, schedule.endsAt))
    .sort((left, right) => left.startsAt.toMillis() - right.startsAt.toMillis())
    .map((schedule) => ({
      kind: 'schedule' as const,
      scheduleId: schedule.id,
      title: schedule.title,
      status: schedule.status === 'draft' ? 'draft' : 'published',
    }))

  const days = localDates(startsAt, endsAt, membership.ministry.timezone)
  const blocks = await Unavailability.query()
    .where('membershipId', membershipId)
    .whereNull('deletedAt')
    .orderBy('startsOn', 'asc')

  for (const block of blocks) {
    const startsOn = block.startsOn.toISODate()
    const endsOn = block.endsOn.toISODate()
    if (!startsOn || !endsOn) {
      continue
    }
    if (days.some((day) => periodCoversDate(startsOn, endsOn, day))) {
      conflicts.push({ kind: 'unavailability', unavailabilityId: block.id })
    }
  }

  return conflicts
}

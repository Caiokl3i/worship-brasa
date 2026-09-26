import { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'
import type Membership from '#models/membership'
import Ministry from '#models/ministry'
import Schedule from '#models/schedule'
import ScheduleAssignment from '#models/schedule_assignment'
import ScheduleParticipant from '#models/schedule_participant'
import ScheduleSong from '#models/schedule_song'
import ScheduleSongHighlight from '#models/schedule_song_highlight'
import Series from '#models/series'
import { FieldException, ScheduleNotFoundException } from '#exceptions/ministry_exceptions'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import {
  enumerateSeriesStarts,
  occurrenceStarts,
  type SeriesEndsMode,
  type SeriesFrequency,
  type SeriesRule,
} from '#schedules/occurrences'

export type SeriesScope = 'only_this' | 'this_and_following' | 'all'

export type RepeatInput = {
  frequency: SeriesFrequency
  interval: number
  weekdays?: number[]
  endsMode: SeriesEndsMode
  endsOn?: string | null
  occurrenceCount?: number | null
}

type Pattern = {
  title: string
  startsAt: DateTime
  endsAt: DateTime | null
  notes: string
  dressCode: string
  confirmationRequired: boolean
}

type MaterializeOptions = {
  now?: DateTime
  trx?: TransactionClientContract
  skipLocalDates?: string[]
}

export function readWeekdays(value: unknown) {
  const source = typeof value === 'string' ? (JSON.parse(value) as unknown) : value
  if (!Array.isArray(source)) {
    return []
  }
  return source.filter((day): day is number => Number.isInteger(day) && day >= 1 && day <= 7)
}

export async function materializeAllSeries(now = DateTime.utc()) {
  const rows = await Series.all()
  for (const row of rows) {
    await materializeSeries(row.id, { now })
  }
  return rows.length
}

export async function materializeForMinistry(actor: Membership, seriesId: string) {
  new MembershipAccessService().assertCanManageSchedules(actor)
  if (!isUuid(seriesId)) {
    throw new ScheduleNotFoundException()
  }

  const series = await Series.query()
    .where('id', seriesId)
    .where('ministryId', actor.ministryId)
    .first()
  if (!series) {
    throw new ScheduleNotFoundException()
  }

  await materializeSeries(series.id)
}

export async function materializeSeries(seriesId: string, options: MaterializeOptions = {}) {
  const trx = options.trx
  const series = await Series.query(trx ? { client: trx } : {})
    .where('id', seriesId)
    .first()
  if (!series) {
    return
  }

  const ministry = await Ministry.query(trx ? { client: trx } : {})
    .where('id', series.ministryId)
    .first()
  if (!ministry) {
    return
  }

  const zone = ministry.timezone
  const now = options.now ?? DateTime.utc()
  const starts = occurrenceStarts(ruleFrom(series, zone), zone, now)
  const existing = await Schedule.query(trx ? { client: trx } : {}).where('seriesId', series.id)
  const takenDates = new Set(options.skipLocalDates ?? [])

  for (const row of existing) {
    const origin = row.originalStartsAt
    if (!origin) {
      continue
    }
    const localDate = origin.setZone(zone).toISODate()
    if (localDate) {
      takenDates.add(localDate)
    }
  }

  for (const start of starts) {
    const localDate = start.setZone(zone).toISODate()
    if (!localDate || takenDates.has(localDate)) {
      continue
    }

    const startsAt = start.toUTC()
    try {
      await Schedule.create(
        {
          ministryId: series.ministryId,
          title: series.title,
          startsAt,
          endsAt: series.durationMinutes
            ? startsAt.plus({ minutes: series.durationMinutes })
            : null,
          status: 'draft',
          notes: series.notes,
          dressCode: series.dressCode,
          confirmationRequired: series.confirmationRequired,
          version: 1,
          seriesId: series.id,
          detachedFromSeries: false,
          originalStartsAt: startsAt,
        },
        trx ? { client: trx } : undefined
      )
    } catch (error) {
      if (!isUniqueViolation(error)) {
        throw error
      }
    }
    takenDates.add(localDate)
  }
}

export async function createRepeatingSchedules(input: {
  ministryId: string
  zone: string
  title: string
  startsAt: DateTime
  endsAt: DateTime | null
  notes: string
  dressCode: string
  confirmationRequired: boolean
  repeat: RepeatInput
}) {
  const interval = Math.trunc(input.repeat.interval)
  if (!Number.isInteger(interval) || interval < 1) {
    throw new FieldException('interval', 'O intervalo precisa ser pelo menos 1.')
  }

  const weekdays = readWeekdays(input.repeat.weekdays ?? [])
  if (input.repeat.frequency === 'weekly' && weekdays.length === 0) {
    throw new FieldException('weekdays', 'Escolha ao menos um dia da semana.')
  }

  let endsOn: DateTime | null = null
  let occurrenceCount: number | null = null
  if (input.repeat.endsMode === 'on_date') {
    const parsed = DateTime.fromISO((input.repeat.endsOn ?? '').slice(0, 10))
    if (!parsed.isValid) {
      throw new FieldException('endsOn', 'Informe a data final.')
    }
    endsOn = parsed
  }
  if (input.repeat.endsMode === 'after_count') {
    const count = input.repeat.occurrenceCount ?? 0
    if (!Number.isInteger(count) || count < 1) {
      throw new FieldException('occurrenceCount', 'Informe quantas vezes.')
    }
    occurrenceCount = count
  }

  const durationMinutes = input.endsAt
    ? Math.round(input.endsAt.diff(input.startsAt, 'minutes').minutes)
    : null

  return db.transaction(async (trx) => {
    const series = await Series.create(
      {
        ministryId: input.ministryId,
        frequency: input.repeat.frequency,
        interval,
        weekdays: JSON.stringify(weekdays),
        endsMode: input.repeat.endsMode,
        endsOn,
        occurrenceCount,
        startsAt: input.startsAt,
        durationMinutes,
        title: input.title,
        notes: input.notes,
        dressCode: input.dressCode,
        confirmationRequired: input.confirmationRequired,
      },
      { client: trx }
    )

    await materializeSeries(series.id, { trx })
    const first = await Schedule.query({ client: trx })
      .where('seriesId', series.id)
      .whereNull('deletedAt')
      .orderBy('startsAt', 'asc')
      .first()

    if (!first) {
      throw new FieldException('startsAt', 'Não há datas futuras nesta repetição.')
    }

    return first.id
  })
}

export async function applySeriesEdit(input: {
  trx: TransactionClientContract
  schedule: Schedule
  zone: string
  scope: SeriesScope
  replaceFilled: boolean
  pattern: Pattern
}) {
  const { trx, schedule, zone, scope, replaceFilled, pattern } = input
  if (scope === 'only_this') {
    schedule.detachedFromSeries = true
    schedule.useTransaction(trx)
    await schedule.save()
    return
  }

  if (!schedule.seriesId) {
    return
  }

  const series = await Series.query({ client: trx })
    .where('id', schedule.seriesId)
    .forUpdate()
    .first()
  if (!series) {
    return
  }

  if (scope === 'all') {
    await writeTemplate(series, pattern, zone, trx)
    const now = DateTime.utc().toMillis()
    const siblings = await Schedule.query({ client: trx })
      .where('seriesId', series.id)
      .whereNull('deletedAt')
      .whereNot('id', schedule.id)

    for (const row of siblings) {
      if (row.detachedFromSeries) {
        continue
      }
      const origin = (row.originalStartsAt ?? row.startsAt).toUTC().toMillis()
      if (origin < now) {
        continue
      }
      const filled = await occurrenceFilled(row.id, trx)
      if (filled && !replaceFilled) {
        continue
      }
      if (filled) {
        await clearChildren(row.id, trx)
      }
      writeOccurrence(row, pattern, zone)
      row.useTransaction(trx)
      await row.save()
    }
    return
  }

  const previousMode = series.endsMode
  const previousEndsOn = dateOnly(series.endsOn)
  const pivot = schedule.originalStartsAt ?? schedule.startsAt
  const slots = enumerateSeriesStarts(
    ruleFrom(series, zone),
    zone,
    series.startsAt.plus({ years: 5 })
  )
  const pivotMillis = pivot.toUTC().toMillis()
  const pivotIndex = slots.findIndex(
    (slot) => Math.abs(slot.toUTC().toMillis() - pivotMillis) < 60_000
  )
  const following =
    pivotIndex >= 0
      ? slots.slice(pivotIndex + 1)
      : slots.filter((slot) => slot.toUTC().toMillis() > pivotMillis)

  schedule.detachedFromSeries = true
  schedule.useTransaction(trx)
  await schedule.save()

  const skip = new Set<string>()
  const pivotDate = pivot.setZone(zone).toISODate()
  if (pivotDate) {
    skip.add(pivotDate)
  }

  const siblings = await Schedule.query({ client: trx })
    .where('seriesId', series.id)
    .whereNull('deletedAt')
    .whereNot('id', schedule.id)

  for (const row of siblings) {
    const origin = row.originalStartsAt ?? row.startsAt
    if (origin.toUTC().toMillis() <= pivotMillis) {
      continue
    }
    const localDate = origin.setZone(zone).toISODate()
    if (row.detachedFromSeries) {
      if (localDate) {
        skip.add(localDate)
      }
      continue
    }
    const filled = await occurrenceFilled(row.id, trx)
    if (filled && !replaceFilled) {
      if (localDate) {
        skip.add(localDate)
      }
      continue
    }
    await Schedule.query({ client: trx }).where('id', row.id).delete()
  }

  if (pivotDate) {
    series.endsMode = 'on_date'
    series.endsOn = DateTime.fromISO(pivotDate).minus({ days: 1 })
    series.useTransaction(trx)
    await series.save()
  }

  if (following.length === 0) {
    return
  }

  const created = await Series.create(
    {
      ministryId: series.ministryId,
      frequency: series.frequency,
      interval: series.interval,
      weekdays: JSON.stringify(readWeekdays(series.weekdays)),
      endsMode: previousMode === 'after_count' ? 'after_count' : previousMode,
      endsOn:
        previousMode === 'on_date' && previousEndsOn ? DateTime.fromISO(previousEndsOn) : null,
      occurrenceCount: previousMode === 'after_count' ? following.length : null,
      startsAt: shiftClock(following[0], pattern.startsAt, zone),
      durationMinutes: durationOf(pattern),
      title: pattern.title,
      notes: pattern.notes,
      dressCode: pattern.dressCode,
      confirmationRequired: pattern.confirmationRequired,
    },
    { client: trx }
  )

  await materializeSeries(created.id, { trx, skipLocalDates: [...skip] })
}

export async function deleteSeriesScope(input: {
  trx: TransactionClientContract
  schedule: Schedule
  zone: string
  scope: SeriesScope
  replaceFilled: boolean
}) {
  const { trx, schedule, zone, scope, replaceFilled } = input
  if (!schedule.seriesId || schedule.detachedFromSeries || scope === 'only_this') {
    schedule.deletedAt = DateTime.utc()
    schedule.useTransaction(trx)
    await schedule.save()
    return
  }

  const series = await Series.query({ client: trx })
    .where('id', schedule.seriesId)
    .forUpdate()
    .first()
  if (!series) {
    schedule.deletedAt = DateTime.utc()
    schedule.useTransaction(trx)
    await schedule.save()
    return
  }

  const now = DateTime.utc().toMillis()
  const pivot = (schedule.originalStartsAt ?? schedule.startsAt).toUTC().toMillis()
  const rows = await Schedule.query({ client: trx })
    .where('seriesId', series.id)
    .whereNull('deletedAt')

  for (const row of rows) {
    const origin = (row.originalStartsAt ?? row.startsAt).toUTC().toMillis()
    const inScope = row.id === schedule.id || (scope === 'all' ? origin >= now : origin >= pivot)
    if (!inScope || (row.id !== schedule.id && row.detachedFromSeries)) {
      continue
    }
    if (row.id !== schedule.id && (await occurrenceFilled(row.id, trx)) && !replaceFilled) {
      continue
    }
    row.deletedAt = DateTime.utc()
    row.useTransaction(trx)
    await row.save()
  }

  const cutoffBase =
    scope === 'all'
      ? DateTime.utc().setZone(zone)
      : (schedule.originalStartsAt ?? schedule.startsAt).setZone(zone)
  const cutoff = cutoffBase.minus({ days: 1 }).toISODate()
  if (cutoff) {
    series.endsMode = 'on_date'
    series.endsOn = DateTime.fromISO(cutoff)
    series.useTransaction(trx)
    await series.save()
  }
}

function ruleFrom(series: Series, zone: string): SeriesRule {
  return {
    frequency: series.frequency as SeriesFrequency,
    interval: series.interval,
    weekdays: readWeekdays(series.weekdays),
    endsMode: series.endsMode as SeriesEndsMode,
    endsOn: dateOnly(series.endsOn),
    occurrenceCount: series.occurrenceCount,
    startsAt: series.startsAt.setZone(zone),
  }
}

function dateOnly(value: DateTime | null) {
  return value?.toISODate() ?? null
}

function durationOf(pattern: Pattern) {
  if (!pattern.endsAt) {
    return null
  }
  return Math.round(pattern.endsAt.diff(pattern.startsAt, 'minutes').minutes)
}

function shiftClock(instant: DateTime, clock: DateTime, zone: string) {
  const local = instant.setZone(zone)
  const zonedClock = clock.setZone(zone)
  return local
    .set({
      hour: zonedClock.hour,
      minute: zonedClock.minute,
      second: 0,
      millisecond: 0,
    })
    .toUTC()
}

async function writeTemplate(
  series: Series,
  pattern: Pattern,
  zone: string,
  trx: TransactionClientContract
) {
  series.startsAt = shiftClock(series.startsAt, pattern.startsAt, zone)
  series.durationMinutes = durationOf(pattern)
  series.title = pattern.title
  series.notes = pattern.notes
  series.dressCode = pattern.dressCode
  series.confirmationRequired = pattern.confirmationRequired
  series.useTransaction(trx)
  await series.save()
}

function writeOccurrence(schedule: Schedule, pattern: Pattern, zone: string) {
  const origin = schedule.originalStartsAt ?? schedule.startsAt
  const startsAt = shiftClock(origin, pattern.startsAt, zone)
  schedule.title = pattern.title
  schedule.notes = pattern.notes
  schedule.dressCode = pattern.dressCode
  schedule.confirmationRequired = pattern.confirmationRequired
  schedule.startsAt = startsAt
  schedule.endsAt = pattern.endsAt ? startsAt.plus({ minutes: durationOf(pattern) ?? 0 }) : null
}

async function occurrenceFilled(scheduleId: string, trx: TransactionClientContract) {
  const participant = await ScheduleParticipant.query({ client: trx })
    .where('scheduleId', scheduleId)
    .first()
  if (participant) {
    return true
  }
  const song = await ScheduleSong.query({ client: trx }).where('scheduleId', scheduleId).first()
  return Boolean(song)
}

async function clearChildren(scheduleId: string, trx: TransactionClientContract) {
  const songs = await ScheduleSong.query({ client: trx }).where('scheduleId', scheduleId)
  const songIds = songs.map((song) => song.id)
  if (songIds.length > 0) {
    await ScheduleSongHighlight.query({ client: trx }).whereIn('scheduleSongId', songIds).delete()
  }

  const participants = await ScheduleParticipant.query({ client: trx }).where(
    'scheduleId',
    scheduleId
  )
  const participantIds = participants.map((participant) => participant.id)
  if (participantIds.length > 0) {
    await ScheduleAssignment.query({ client: trx })
      .whereIn('participantId', participantIds)
      .delete()
  }

  await ScheduleParticipant.query({ client: trx }).where('scheduleId', scheduleId).delete()
  await ScheduleSong.query({ client: trx }).where('scheduleId', scheduleId).delete()
}

function isUniqueViolation(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return false
  }
  if ('code' in error && error.code === '23505') {
    return true
  }
  return (
    'cause' in error &&
    typeof error.cause === 'object' &&
    error.cause !== null &&
    'code' in error.cause &&
    error.cause.code === '23505'
  )
}

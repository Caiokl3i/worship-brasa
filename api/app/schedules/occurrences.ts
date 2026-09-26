import { type DateTime } from 'luxon'

export type SeriesFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
export type SeriesEndsMode = 'never' | 'on_date' | 'after_count'

export type SeriesRule = {
  frequency: SeriesFrequency
  interval: number
  weekdays: number[]
  endsMode: SeriesEndsMode
  endsOn: string | null
  occurrenceCount: number | null
  startsAt: DateTime
}

const HORIZON_DAYS = 90

export function occurrenceStarts(rule: SeriesRule, zone: string, now: DateTime) {
  const horizon = now.toUTC().plus({ days: HORIZON_DAYS })
  return enumerateSeriesStarts(rule, zone, horizon).filter(
    (start) => start.toUTC().toMillis() >= now.toUTC().toMillis()
  )
}

export function enumerateSeriesStarts(rule: SeriesRule, zone: string, horizon: DateTime) {
  const anchor = rule.startsAt.setZone(zone)
  if (!anchor.isValid) {
    return []
  }

  const interval = Math.max(1, Math.trunc(rule.interval) || 1)
  const limit = rule.endsMode === 'after_count' ? Math.max(0, rule.occurrenceCount ?? 0) : null
  const endsOn = rule.endsMode === 'on_date' ? rule.endsOn : null
  const horizonMillis = horizon.toUTC().toMillis()
  const results: DateTime[] = []

  const push = (start: DateTime) => {
    if (start.toUTC().toMillis() > horizonMillis) {
      return 'past-horizon' as const
    }
    const localDate = start.setZone(zone).toISODate()
    if (endsOn && localDate && localDate > endsOn) {
      return 'ended' as const
    }
    results.push(start.setZone(zone))
    if (limit !== null && results.length >= limit) {
      return 'ended' as const
    }
    return 'ok' as const
  }

  if (rule.frequency === 'daily') {
    let cursor = anchor
    for (let step = 0; step < 2000; step++) {
      const outcome = push(cursor)
      if (outcome !== 'ok') {
        break
      }
      cursor = cursor.plus({ days: interval })
    }
    return results
  }

  if (rule.frequency === 'weekly') {
    const weekdays = [...new Set(rule.weekdays.filter((day) => day >= 1 && day <= 7))].sort(
      (left, right) => left - right
    )
    if (weekdays.length === 0 || limit === 0) {
      return []
    }

    const anchorWeek = anchor.startOf('week')
    for (let weekIndex = 0; weekIndex < 500; weekIndex++) {
      const weekStart = anchorWeek.plus({ weeks: weekIndex * interval })
      if (weekStart.toUTC().toMillis() > horizonMillis) {
        break
      }

      let stop = false
      for (const weekday of weekdays) {
        const day = weekStart.plus({ days: weekday - 1 }).set({
          hour: anchor.hour,
          minute: anchor.minute,
          second: anchor.second,
          millisecond: 0,
        })
        if (day.toUTC().toMillis() < anchor.toUTC().toMillis()) {
          continue
        }
        const outcome = push(day)
        if (outcome !== 'ok') {
          stop = true
          break
        }
      }
      if (stop) {
        break
      }
    }
    return results
  }

  if (rule.frequency === 'monthly' || rule.frequency === 'yearly') {
    for (let index = 0; index < 500; index++) {
      const day =
        rule.frequency === 'monthly'
          ? atMonth(anchor, index * interval)
          : atYear(anchor, index * interval)
      const outcome = push(day)
      if (outcome !== 'ok') {
        break
      }
    }
  }

  return results
}

function atMonth(anchor: DateTime, months: number) {
  const shifted = anchor.startOf('month').plus({ months })
  const day = Math.min(anchor.day, shifted.endOf('month').day)
  return shifted.set({
    day,
    hour: anchor.hour,
    minute: anchor.minute,
    second: anchor.second,
    millisecond: 0,
  })
}

function atYear(anchor: DateTime, years: number) {
  const monthStart = anchor.startOf('year').plus({ years }).set({ month: anchor.month, day: 1 })
  const day = Math.min(anchor.day, monthStart.endOf('month').day)
  return monthStart.set({
    day,
    hour: anchor.hour,
    minute: anchor.minute,
    second: anchor.second,
    millisecond: 0,
  })
}

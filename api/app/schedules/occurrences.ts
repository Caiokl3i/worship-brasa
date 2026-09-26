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
  return enumerateSeriesStarts(rule, zone, horizon, now)
}

export function enumerateSeriesStarts(
  rule: SeriesRule,
  zone: string,
  horizon: DateTime,
  emitFrom: DateTime | null = null
) {
  const anchor = rule.startsAt.setZone(zone)
  if (!anchor.isValid) {
    return []
  }

  const interval = Math.max(1, Math.trunc(rule.interval) || 1)
  const limit = rule.endsMode === 'after_count' ? Math.max(0, rule.occurrenceCount ?? 0) : null
  const endsOn = rule.endsMode === 'on_date' ? rule.endsOn : null
  const horizonMillis = horizon.toUTC().toMillis()
  const emitMillis = emitFrom?.toUTC().toMillis() ?? null
  const results: DateTime[] = []
  let skipped = 0

  const push = (start: DateTime) => {
    if (start.toUTC().toMillis() > horizonMillis) {
      return 'past-horizon' as const
    }
    const localDate = start.setZone(zone).toISODate()
    if (endsOn && localDate && localDate > endsOn) {
      return 'ended' as const
    }
    if (emitMillis !== null && start.toUTC().toMillis() < emitMillis) {
      skipped += 1
      if (limit !== null && skipped >= limit) {
        return 'ended' as const
      }
      return 'ok' as const
    }
    results.push(start.setZone(zone))
    if (limit !== null && skipped + results.length >= limit) {
      return 'ended' as const
    }
    return 'ok' as const
  }

  if (limit === 0) {
    return []
  }

  if (rule.frequency === 'daily') {
    const jumped = jumpDaily(anchor, interval, emitFrom)
    skipped = jumped.skipped
    if (limit !== null && skipped >= limit) {
      return []
    }
    let cursor = jumped.cursor
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
    if (weekdays.length === 0) {
      return []
    }

    const anchorWeek = anchor.startOf('week')
    const jumped = jumpWeekly(anchor, weekdays, interval, emitFrom, zone, anchorWeek)
    skipped = jumped.skipped
    if (limit !== null && skipped >= limit) {
      return []
    }

    for (let weekIndex = jumped.weekIndex; weekIndex < jumped.weekIndex + 500; weekIndex++) {
      const weekStart = anchorWeek.plus({ weeks: weekIndex * interval })
      if (weekStart.toUTC().toMillis() > horizonMillis) {
        break
      }

      let stop = false
      for (const weekday of weekdays) {
        const day = atWeekday(weekStart, weekday, anchor)
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
    const at =
      rule.frequency === 'monthly'
        ? (index: number) => atMonth(anchor, index * interval)
        : (index: number) => atYear(anchor, index * interval)
    const jumped =
      rule.frequency === 'monthly'
        ? jumpMonthly(anchor, interval, emitFrom)
        : jumpYearly(anchor, interval, emitFrom)
    skipped = jumped.skipped
    if (limit !== null && skipped >= limit) {
      return []
    }

    for (let index = jumped.index; index < jumped.index + 500; index++) {
      const outcome = push(at(index))
      if (outcome !== 'ok') {
        break
      }
    }
  }

  return results
}

function jumpDaily(anchor: DateTime, interval: number, emitFrom: DateTime | null) {
  if (!emitFrom || anchor.toUTC().toMillis() >= emitFrom.toUTC().toMillis()) {
    return { cursor: anchor, skipped: 0 }
  }

  const days = Math.floor(
    emitFrom.setZone(anchor.zone).startOf('day').diff(anchor.startOf('day'), 'days').days
  )
  let steps = Math.max(0, Math.floor(days / interval))
  let cursor = anchor.plus({ days: steps * interval })
  while (cursor.toUTC().toMillis() < emitFrom.toUTC().toMillis()) {
    cursor = cursor.plus({ days: interval })
    steps += 1
  }
  return { cursor, skipped: steps }
}

function jumpWeekly(
  anchor: DateTime,
  weekdays: number[],
  interval: number,
  emitFrom: DateTime | null,
  zone: string,
  anchorWeek: DateTime
) {
  if (!emitFrom || anchor.toUTC().toMillis() >= emitFrom.toUTC().toMillis()) {
    return { weekIndex: 0, skipped: 0 }
  }

  const weeksAhead = Math.floor(
    emitFrom.setZone(zone).startOf('week').diff(anchorWeek, 'weeks').weeks
  )
  const weekIndex = Math.max(0, Math.floor(weeksAhead / interval))
  if (weekIndex === 0) {
    return { weekIndex: 0, skipped: 0 }
  }

  const anchorMillis = anchor.toUTC().toMillis()
  const first = weekdays.filter(
    (weekday) => atWeekday(anchorWeek, weekday, anchor).toUTC().toMillis() >= anchorMillis
  ).length
  return { weekIndex, skipped: first + (weekIndex - 1) * weekdays.length }
}

function jumpMonthly(anchor: DateTime, interval: number, emitFrom: DateTime | null) {
  if (!emitFrom || anchor.toUTC().toMillis() >= emitFrom.toUTC().toMillis()) {
    return { index: 0, skipped: 0 }
  }

  const emit = emitFrom.setZone(anchor.zone)
  const months = (emit.year - anchor.year) * 12 + (emit.month - anchor.month)
  return alignStep(emitFrom, Math.floor(months / interval), (index) =>
    atMonth(anchor, index * interval)
  )
}

function jumpYearly(anchor: DateTime, interval: number, emitFrom: DateTime | null) {
  if (!emitFrom || anchor.toUTC().toMillis() >= emitFrom.toUTC().toMillis()) {
    return { index: 0, skipped: 0 }
  }

  const years = emitFrom.setZone(anchor.zone).year - anchor.year
  return alignStep(emitFrom, Math.floor(years / interval), (index) =>
    atYear(anchor, index * interval)
  )
}

function alignStep(emitFrom: DateTime, estimate: number, at: (index: number) => DateTime) {
  let index = Math.max(0, estimate)
  const emitMillis = emitFrom.toUTC().toMillis()
  while (at(index).toUTC().toMillis() < emitMillis && index < estimate + 24) {
    index += 1
  }
  while (
    index > 0 &&
    at(index - 1)
      .toUTC()
      .toMillis() >= emitMillis
  ) {
    index -= 1
  }
  return { index, skipped: index }
}

function atWeekday(weekStart: DateTime, weekday: number, anchor: DateTime) {
  return weekStart.plus({ days: weekday - 1 }).set({
    hour: anchor.hour,
    minute: anchor.minute,
    second: anchor.second,
    millisecond: 0,
  })
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

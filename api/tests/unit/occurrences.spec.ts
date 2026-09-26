import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { occurrenceStarts, type SeriesRule } from '#schedules/occurrences'

const zone = 'America/Sao_Paulo'

function rule(
  partial: Partial<SeriesRule> & Pick<SeriesRule, 'frequency' | 'startsAt'>
): SeriesRule {
  return {
    interval: 1,
    weekdays: [],
    endsMode: 'never',
    endsOn: null,
    occurrenceCount: null,
    ...partial,
  }
}

test.group('Ocorrências', () => {
  test('série diária antiga ainda preenche os próximos 90 dias', ({ assert }) => {
    const now = DateTime.fromObject({ year: 2026, month: 9, day: 26, hour: 12 }, { zone })
    const starts = occurrenceStarts(
      rule({
        frequency: 'daily',
        startsAt: DateTime.fromObject({ year: 2010, month: 1, day: 1, hour: 18 }, { zone }),
      }),
      zone,
      now
    )

    assert.equal(starts[0].toISODate(), '2026-09-26')
    assert.equal(starts[0].hour, 18)
    assert.equal(starts.at(-1)?.toISODate(), '2026-12-24')
    assert.lengthOf(starts, 90)
    assert.isTrue(starts.every((start) => start.hour === 18 && start.zoneName === zone))
    assert.isTrue(starts.every((start) => start.toUTC().toMillis() >= now.toUTC().toMillis()))
  })

  test('quantidade já esgotada não gera data nova', ({ assert }) => {
    const now = DateTime.fromObject({ year: 2026, month: 9, day: 26, hour: 12 }, { zone })
    const starts = occurrenceStarts(
      rule({
        frequency: 'daily',
        endsMode: 'after_count',
        occurrenceCount: 10,
        startsAt: DateTime.fromObject({ year: 2010, month: 1, day: 1, hour: 18 }, { zone }),
      }),
      zone,
      now
    )
    assert.lengthOf(starts, 0)
  })

  test('domingo antigo continua no domingo, e o mensal no dia 31 cai no fim do mês', ({
    assert,
  }) => {
    const now = DateTime.fromObject({ year: 2026, month: 9, day: 26, hour: 12 }, { zone })
    const anchor = DateTime.fromObject({ year: 2016, month: 1, day: 3, hour: 18 }, { zone })
    assert.equal(anchor.weekday, 7)

    const sundays = occurrenceStarts(
      rule({ frequency: 'weekly', weekdays: [7], startsAt: anchor }),
      zone,
      now
    )
    assert.equal(sundays[0].toISODate(), '2026-09-27')
    assert.equal(sundays.at(-1)?.toISODate(), '2026-12-20')
    assert.isTrue(sundays.every((start) => start.weekday === 7 && start.hour === 18))

    const fortnight = occurrenceStarts(
      rule({ frequency: 'weekly', interval: 2, weekdays: [7], startsAt: anchor }),
      zone,
      now
    )
    assert.isTrue(
      fortnight.every((start) => {
        const days = start.startOf('day').diff(anchor.startOf('day'), 'days').days
        return start.weekday === 7 && days % 14 === 0
      })
    )

    const months = occurrenceStarts(
      rule({
        frequency: 'monthly',
        startsAt: DateTime.fromObject({ year: 2010, month: 1, day: 31, hour: 18 }, { zone }),
      }),
      zone,
      now
    )
    assert.deepEqual(
      months.map((start) => start.toISODate()),
      ['2026-09-30', '2026-10-31', '2026-11-30']
    )
    assert.isTrue(months.every((start) => start.hour === 18))
  })
})

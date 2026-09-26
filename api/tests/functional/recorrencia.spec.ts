import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import Schedule from '#models/schedule'
import ScheduleParticipant from '#models/schedule_participant'
import { occurrenceStarts } from '#schedules/occurrences'
import { materializeSeries } from '#services/series_service'

const password = 'senha-segura'
const zone = 'America/Sao_Paulo'

async function register(client: ApiClient, name: string, email: string) {
  const response = await client.post('/api/cadastrar').json({
    name,
    email,
    password,
    passwordConfirmation: password,
  })
  response.assertStatus(201)
}

async function createMinistry(client: ApiClient) {
  const response = await client
    .post('/api/ministerios')
    .json({ name: 'Louvor Domingo', functions: ['Vocal'] })
  response.assertStatus(201)
  return response.body().id as string
}

function repeat(occurrenceCount: number, weekdays = [7], interval = 1) {
  return {
    frequency: 'weekly' as const,
    interval,
    weekdays,
    endsMode: 'after_count' as const,
    occurrenceCount,
  }
}

async function createSeries(
  client: ApiClient,
  ministryId: string,
  startsAt: string,
  occurrenceCount = 4
) {
  const response = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
    title: 'Culto de domingo',
    startsAt,
    endsAt: null,
    notes: '',
    dressCode: '',
    repeat: repeat(occurrenceCount),
  })
  response.assertStatus(201)
  return response
}

test.group('Recorrência', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('domingo, quinzena, dia 31 e o fuso em que o UTC já virou o dia', ({ assert }) => {
    const sunday = DateTime.fromObject({ year: 2026, month: 10, day: 4, hour: 18 }, { zone })
    const before = DateTime.fromObject({ year: 2026, month: 10, day: 3, hour: 12 }, { zone })
    const weekly = {
      frequency: 'weekly' as const,
      interval: 1,
      weekdays: [7],
      endsMode: 'never' as const,
      endsOn: null,
      occurrenceCount: null,
      startsAt: sunday,
    }

    const sundays = occurrenceStarts(weekly, zone, before)
    assert.equal(sundays[0].toISODate(), '2026-10-04')
    assert.equal(sundays[0].hour, 18)
    assert.equal(sundays[0].weekday, 7)
    assert.equal(sundays[0].toUTC().toISO(), '2026-10-04T21:00:00.000Z')
    assert.equal(sundays.at(-1)?.toISODate(), '2026-12-27')
    assert.isTrue(sundays.every((start) => start.weekday === 7))
    assert.isFalse(sundays.some((start) => start.toISODate() === '2026-10-03'))

    const fortnight = occurrenceStarts({ ...weekly, interval: 2 }, zone, before)
    assert.deepEqual(
      fortnight.map((start) => start.toISODate()),
      [
        '2026-10-04',
        '2026-10-18',
        '2026-11-01',
        '2026-11-15',
        '2026-11-29',
        '2026-12-13',
        '2026-12-27',
      ]
    )

    const counted = occurrenceStarts(
      { ...weekly, endsMode: 'after_count', occurrenceCount: 2 },
      zone,
      sunday.plus({ days: 1 })
    )
    assert.lengthOf(counted, 1)
    assert.equal(counted[0].toISODate(), '2026-10-11')

    const until = occurrenceStarts(
      { ...weekly, endsMode: 'on_date', endsOn: '2026-10-11' },
      zone,
      before
    )
    assert.deepEqual(
      until.map((start) => start.toISODate()),
      ['2026-10-04', '2026-10-11']
    )

    const monthAnchor = DateTime.fromObject({ year: 2026, month: 1, day: 31, hour: 18 }, { zone })
    const months = occurrenceStarts(
      {
        frequency: 'monthly',
        interval: 1,
        weekdays: [],
        endsMode: 'never',
        endsOn: null,
        occurrenceCount: null,
        startsAt: monthAnchor,
      },
      zone,
      monthAnchor.minus({ hours: 1 })
    )
    assert.deepEqual(
      months.map((start) => start.toISODate()),
      ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']
    )

    const leap = DateTime.fromObject({ year: 2024, month: 2, day: 29, hour: 18 }, { zone })
    const years = occurrenceStarts(
      {
        frequency: 'yearly',
        interval: 1,
        weekdays: [],
        endsMode: 'never',
        endsOn: null,
        occurrenceCount: null,
        startsAt: leap,
      },
      zone,
      DateTime.fromObject({ year: 2024, month: 12, day: 1 }, { zone })
    )
    assert.deepEqual(
      years.map((start) => start.toISODate()),
      ['2025-02-28']
    )
    assert.equal(years[0].hour, 18)

    const late = DateTime.fromObject({ year: 2026, month: 10, day: 4, hour: 22 }, { zone })
    const zoned = occurrenceStarts(
      { ...weekly, startsAt: late, endsMode: 'after_count', occurrenceCount: 1 },
      zone,
      late.minus({ hours: 1 })
    )
    assert.equal(zoned[0].toISODate(), '2026-10-04')
    assert.equal(zoned[0].weekday, 7)
    assert.equal(zoned[0].toUTC().toISODate(), '2026-10-05')
  })

  test('materializar duas vezes não duplica e o domingo 22h não vira sábado', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const created = await createSeries(client, ministryId, '2026-10-04T18:00')
    assert.equal(created.body().startsAt, '2026-10-04T21:00:00.000Z')
    assert.equal(created.body().status, 'draft')
    assert.isTrue(created.body().confirmationRequired)
    assert.lengthOf(created.body().participants, 0)
    assert.lengthOf(created.body().series.upcoming, 4)

    const seriesId = created.body().series.id as string
    const before = await Schedule.query().where('seriesId', seriesId).whereNull('deletedAt')
    await materializeSeries(seriesId)
    await materializeSeries(seriesId)
    const after = await Schedule.query().where('seriesId', seriesId).whereNull('deletedAt')
    assert.lengthOf(after, before.length)

    const refreshed = await client.post(
      `/api/ministerios/${ministryId}/series/${seriesId}/materializar`
    )
    refreshed.assertStatus(204)
    const again = await Schedule.query().where('seriesId', seriesId).whereNull('deletedAt')
    assert.lengthOf(again, 4)

    const late = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto tarde',
      startsAt: '2026-10-04T22:00',
      endsAt: null,
      repeat: repeat(2),
    })
    late.assertStatus(201)
    assert.equal(late.body().startsAt, '2026-10-05T01:00:00.000Z')
    assert.equal(late.body().series.upcoming[1].startsAt, '2026-10-12T01:00:00.000Z')
  })

  test('semana sem dia é recusada', async ({ client }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const response = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T18:00',
      endsAt: null,
      repeat: repeat(2, []),
    })
    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'weekdays', message: 'Escolha ao menos um dia da semana.' }],
    })
  })

  test('esta e as seguintes preserva a segunda preenchida', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string

    const created = await createSeries(client, ministryId, '2026-10-04T18:00')
    const upcoming = created.body().series.upcoming as Array<{ id: string }>
    const second = await client.get(`/api/ministerios/${ministryId}/escalas/${upcoming[1].id}`)
    const filled = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${upcoming[1].id}`)
      .json(
        writeBody(second.body(), {
          participants: [{ membershipId: anaId, functionIds: [vocalId] }],
        })
      )
    filled.assertStatus(200)

    const first = await client.get(`/api/ministerios/${ministryId}/escalas/${upcoming[0].id}`)
    const edited = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${upcoming[0].id}`)
      .json(writeBody(first.body(), { title: 'Culto novo', scope: 'this_and_following' }))
    edited.assertStatus(200)
    assert.equal(edited.body().title, 'Culto novo')
    assert.isTrue(edited.body().series.detached)
    assert.equal(edited.body().series.upcoming.length > 0, true)

    const rows = await Schedule.query()
      .where('ministryId', ministryId)
      .whereNull('deletedAt')
      .orderBy('startsAt', 'asc')
    assert.lengthOf(rows, 4)
    assert.equal(rows[0].title, 'Culto novo')
    assert.isTrue(rows[0].detachedFromSeries)
    assert.equal(rows[1].title, 'Culto de domingo')
    assert.equal(rows[1].seriesId, rows[0].seriesId)
    const team = await ScheduleParticipant.query().where('scheduleId', rows[1].id)
    assert.lengthOf(team, 1)
    assert.equal(rows[2].title, 'Culto novo')
    assert.notEqual(rows[2].seriesId, rows[0].seriesId)
    assert.equal(rows[3].title, 'Culto novo')
  })

  test('editar só uma data desanexa e as outras ficam no padrão', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const created = await createSeries(client, ministryId, '2026-10-04T18:00')
    const firstId = created.body().id as string
    const secondId = created.body().series.upcoming[1].id as string

    const missing = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${firstId}`)
      .json(writeBody(created.body(), { title: 'Só esta' }))
    missing.assertStatus(422)
    missing.assertBodyContains({
      errors: [{ field: 'scope', message: 'Escolha o alcance da alteração.' }],
    })

    const edited = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${firstId}`)
      .json(writeBody(created.body(), { title: 'Só esta', scope: 'only_this' }))
    edited.assertStatus(200)
    assert.isTrue(edited.body().series.detached)
    assert.equal(edited.body().title, 'Só esta')

    const second = await client.get(`/api/ministerios/${ministryId}/escalas/${secondId}`)
    second.assertStatus(200)
    assert.equal(second.body().title, 'Culto de domingo')
    assert.isFalse(second.body().series.detached)
  })

  test('editar todas não reescreve a que tem equipe nem a passada', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string

    const created = await createSeries(client, ministryId, '2026-10-04T18:00')
    const seriesId = created.body().series.id as string
    const upcoming = created.body().series.upcoming as Array<{ id: string }>
    const past = await Schedule.create({
      ministryId,
      title: 'Passado',
      startsAt: DateTime.fromISO('2026-01-04T21:00:00.000Z'),
      endsAt: null,
      status: 'draft',
      notes: '',
      dressCode: '',
      confirmationRequired: true,
      version: 1,
      seriesId,
      detachedFromSeries: false,
      originalStartsAt: DateTime.fromISO('2026-01-04T21:00:00.000Z'),
    })

    const second = await client.get(`/api/ministerios/${ministryId}/escalas/${upcoming[1].id}`)
    const filled = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${upcoming[1].id}`)
      .json(
        writeBody(second.body(), {
          participants: [{ membershipId: anaId, functionIds: [vocalId] }],
        })
      )
    filled.assertStatus(200)

    const first = await client.get(`/api/ministerios/${ministryId}/escalas/${upcoming[0].id}`)
    const edited = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${upcoming[0].id}`)
      .json(writeBody(first.body(), { title: 'Todas', scope: 'all' }))
    edited.assertStatus(200)
    assert.isFalse(edited.body().series.detached)

    await past.refresh()
    assert.equal(past.title, 'Passado')

    const kept = await Schedule.findOrFail(upcoming[1].id)
    assert.equal(kept.title, 'Culto de domingo')
    const team = await ScheduleParticipant.query().where('scheduleId', kept.id)
    assert.lengthOf(team, 1)

    const third = await Schedule.findOrFail(upcoming[2].id)
    assert.equal(third.title, 'Todas')
  })

  test('excluir uma data impede que ela volte', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const created = await createSeries(client, ministryId, '2026-10-04T18:00', 2)
    const seriesId = created.body().series.id as string
    const secondId = created.body().series.upcoming[1].id as string
    const target = await Schedule.findOrFail(secondId)
    const original = target.originalStartsAt!.toUTC().toMillis()

    const removed = await client
      .post(`/api/ministerios/${ministryId}/escalas/${secondId}/excluir`)
      .json({ scope: 'only_this' })
    removed.assertStatus(204)

    await materializeSeries(seriesId)
    const rows = await Schedule.query().where('seriesId', seriesId)
    const same = rows.filter((row) => row.originalStartsAt?.toUTC().toMillis() === original)
    assert.lengthOf(same, 1)
    assert.isNotNull(same[0].deletedAt)
    const live = await Schedule.query().where('seriesId', seriesId).whereNull('deletedAt')
    assert.lengthOf(live, 1)

    const missing = await client.get(`/api/ministerios/${ministryId}/escalas/${secondId}`)
    missing.assertStatus(404)
  })
})

function writeBody(
  detail: {
    version: number
    title: string
    startsAt: string
    endsAt: string | null
    notes: string
    dressCode: string
    confirmationRequired: boolean
    participants: Array<{ membershipId: string; functions: Array<{ id: string }> }>
  },
  extra: Record<string, unknown> = {}
) {
  return {
    version: detail.version,
    title: detail.title,
    startsAt: detail.startsAt,
    endsAt: detail.endsAt,
    notes: detail.notes,
    dressCode: detail.dressCode,
    confirmationRequired: detail.confirmationRequired,
    participants: detail.participants.map((participant) => ({
      membershipId: participant.membershipId,
      functionIds: participant.functions.map((item) => item.id),
    })),
    songs: [],
    ...extra,
  }
}

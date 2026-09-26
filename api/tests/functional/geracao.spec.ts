import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import Schedule from '#models/schedule'
import Song from '#models/song'

const password = 'senha-segura'

async function register(client: ApiClient, name: string, email: string) {
  const response = await client.post('/api/cadastrar').json({
    name,
    email,
    password,
    passwordConfirmation: password,
  })
  response.assertStatus(201)
}

async function login(client: ApiClient, email: string) {
  const response = await client.post('/api/entrar').json({ email, password })
  response.assertStatus(200)
}

async function createMinistry(client: ApiClient, functions: string[]) {
  const response = await client.post('/api/ministerios').json({ name: 'Louvor Domingo', functions })
  response.assertStatus(201)
  return response.body().id as string
}

async function functionIds(client: ApiClient, ministryId: string) {
  const response = await client.get(`/api/ministerios/${ministryId}/funcoes`)
  response.assertStatus(200)
  return Object.fromEntries(
    response.body().functions.map((item: { name: string; id: string }) => [item.name, item.id])
  ) as Record<string, string>
}

async function membershipId(client: ApiClient, ministryId: string, name: string) {
  const response = await client.get(`/api/ministerios/${ministryId}/membros`)
  const member = response.body().members.find((item: { name: string }) => item.name === name)
  return member.membershipId as string
}

async function approve(client: ApiClient, ministryId: string, names: string[]) {
  const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
  invite.assertStatus(201)
  const code = invite.body().invite.code as string
  const ids: Record<string, string> = {}

  for (const name of names) {
    await register(client, name, `${name.toLowerCase()}@igreja.com`)
    const entered = await client.post('/api/convites/entrar').json({ code })
    entered.assertStatus(200)
    ids[name] = entered.body().membershipId as string
  }

  await login(client, 'ana@igreja.com')
  for (const id of Object.values(ids)) {
    const approved = await client.post(`/api/ministerios/${ministryId}/pedidos/${id}/aprovar`)
    approved.assertStatus(204)
  }
  return ids
}

async function assign(client: ApiClient, ministryId: string, memberId: string, functionId: string) {
  const response = await client
    .put(`/api/ministerios/${ministryId}/membros/${memberId}/funcoes`)
    .json({ functionIds: [functionId] })
  response.assertStatus(204)
}

async function publish(
  client: ApiClient,
  ministryId: string,
  startsAt: string,
  participants: { membershipId: string; functionIds: string[] }[],
  songs: { songId: string; versionId: string }[] = []
) {
  const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
    title: 'Culto',
    startsAt,
    endsAt: null,
    confirmationRequired: false,
  })
  created.assertStatus(201)
  const saved = await client
    .post(`/api/ministerios/${ministryId}/escalas/${created.body().id}/publicar`)
    .json({
      version: 1,
      title: 'Culto',
      startsAt,
      endsAt: null,
      notes: '',
      dressCode: '',
      confirmationRequired: false,
      participants,
      songs: songs.map((song) => ({
        songId: song.songId,
        versionId: song.versionId,
        keyOverride: null,
        notes: '',
        highlights: [],
      })),
    })
  saved.assertStatus(200)
  return created.body().id as string
}

async function draft(client: ApiClient, ministryId: string, startsAt: string) {
  const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
    title: 'Culto',
    startsAt,
    endsAt: null,
    confirmationRequired: false,
  })
  created.assertStatus(201)
  return created.body().id as string
}

function suggestBody(functionId: string | null, extra: Record<string, unknown> = {}) {
  return {
    peopleStrategy: 'balanced',
    historyMonths: 3,
    minGapDays: null,
    preferFewerAbsences: false,
    allowMultipleFunctions: false,
    unavailability: 'respect',
    conflict: 'skip',
    songStrategy: 'rotation',
    songCount: 0,
    minSongGapDays: null,
    includeUnplayed: true,
    vacancies: functionId ? [{ functionId, quantity: 1 }] : [],
    fixed: [],
    excludedMembershipIds: [],
    ...extra,
  }
}

async function createSong(
  client: ApiClient,
  ministryId: string,
  title: string,
  defaultKey: string
) {
  const created = await client.post(`/api/ministerios/${ministryId}/musicas`).json({
    title,
    artist: 'Adhemar',
    bpm: null,
    durationSeconds: null,
    defaultKey,
    classificationId: null,
    folderId: null,
    versions: [{ name: 'Base', key: 'G' }],
    links: [],
  })
  created.assertStatus(201)
  return {
    id: created.body().id as string,
    versionId: created.body().versions[0].id as string,
  }
}

test.group('Geração', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a equilibrada escolhe quem tem menos escalas e o motivo traz a contagem', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    const ids = await approve(client, ministryId, ['Bia'])
    await assign(client, ministryId, anaId, functions.Vocal)
    await assign(client, ministryId, ids.Bia, functions.Vocal)

    await publish(client, ministryId, '2026-08-16T19:00', [
      { membershipId: anaId, functionIds: [functions.Vocal] },
    ])
    await publish(client, ministryId, '2026-09-06T19:00', [
      { membershipId: anaId, functionIds: [functions.Vocal] },
    ])
    await publish(client, ministryId, '2026-09-20T19:00', [
      { membershipId: ids.Bia, functionIds: [functions.Vocal] },
    ])

    const scheduleId = await draft(client, ministryId, '2026-10-04T19:00')
    const suggestion = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`)
      .json(suggestBody(functions.Vocal))
    suggestion.assertStatus(200)

    const people = suggestion.body().vacancies[0].people as { name: string; reason: string }[]
    assert.lengthOf(people, 1)
    assert.equal(people[0].name, 'Bia')
    assert.include(people[0].reason, '1 escala nos últimos 3 meses')
  })

  test('indisponível sai no modo respeitar e volta com o aviso', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const functions = await functionIds(client, ministryId)
    const ids = await approve(client, ministryId, ['Bia'])
    await assign(client, ministryId, ids.Bia, functions.Vocal)
    const blocked = await client.post(`/api/ministerios/${ministryId}/indisponibilidades`).json({
      membershipId: ids.Bia,
      startsOn: '2026-10-04',
      endsOn: '2026-10-04',
      description: 'viagem',
    })
    blocked.assertStatus(201)

    const scheduleId = await draft(client, ministryId, '2026-10-04T19:00')
    const respected = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`)
      .json(suggestBody(functions.Vocal, { unavailability: 'respect' }))
    respected.assertStatus(200)
    assert.deepEqual(respected.body().vacancies[0].people, [])
    assert.include(respected.body().warnings.join(' '), '1 pessoa')

    const warned = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`)
      .json(suggestBody(functions.Vocal, { unavailability: 'warn' }))
    warned.assertStatus(200)
    const people = warned.body().vacancies[0].people as { name: string; reason: string }[]
    assert.equal(people[0].name, 'Bia')
    assert.include(people[0].reason, 'indisponível — incluído porque você permitiu aviso')
  })

  test('música tocada ontem não volta se o intervalo mínimo é 7 dias', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    const ontem = await createSong(client, ministryId, 'Ontem', 'C')
    const nova = await createSong(client, ministryId, 'Nova', 'D')
    await publish(
      client,
      ministryId,
      '2026-10-03T19:00',
      [{ membershipId: anaId, functionIds: [functions.Vocal] }],
      [{ songId: ontem.id, versionId: ontem.versionId }]
    )

    const scheduleId = await draft(client, ministryId, '2026-10-04T19:00')
    const suggestion = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`)
      .json(
        suggestBody(null, {
          songCount: 1,
          minSongGapDays: 7,
          includeUnplayed: true,
        })
      )
    suggestion.assertStatus(200)
    const ids = suggestion.body().songs.map((song: { songId: string }) => song.songId)
    assert.deepEqual(ids, [nova.id])
    assert.equal(suggestion.body().songs[0].reason, 'ainda não tocada')
  })

  test('aceitar pela escala não muda o tom padrão do repertório', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const song = await createSong(client, ministryId, 'Grande é o Senhor', 'C')
    const scheduleId = await draft(client, ministryId, '2026-10-04T19:00')
    const suggestion = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`)
      .json(suggestBody(null, { songCount: 1 }))
    suggestion.assertStatus(200)
    const suggested = suggestion.body().songs[0] as {
      songId: string
      versionId: string
      keyOverride?: string
    }
    assert.equal(suggested.songId, song.id)
    assert.isUndefined(suggested.keyOverride)

    const saved = await client.patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`).json({
      version: 1,
      title: 'Culto',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      notes: '',
      dressCode: '',
      confirmationRequired: false,
      participants: [],
      songs: [
        {
          songId: suggested.songId,
          versionId: suggested.versionId,
          keyOverride: null,
          notes: '',
          highlights: [],
        },
      ],
    })
    saved.assertStatus(200)

    const stored = await Song.findOrFail(song.id)
    assert.equal(stored.defaultKey, 'C')
  })

  test('gerar não muda o status da escala', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const scheduleId = await draft(client, ministryId, '2026-10-04T19:00')
    const suggestion = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`)
      .json(suggestBody(null))
    suggestion.assertStatus(200)

    const schedule = await Schedule.findOrFail(scheduleId)
    assert.equal(schedule.status, 'draft')
    assert.equal(schedule.version, 1)

    await approve(client, ministryId, ['Bia'])
    await login(client, 'bia@igreja.com')
    const hidden = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`)
      .json(suggestBody(null))
    hidden.assertStatus(404)
    hidden.assertBodyContains({ message: 'Escala não encontrada.' })
  })

  test('duas gerações sem aceitar não gravam participante nem música', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    await assign(client, ministryId, anaId, functions.Vocal)
    await createSong(client, ministryId, 'Nova', 'C')
    const scheduleId = await draft(client, ministryId, '2026-10-04T19:00')
    const body = suggestBody(functions.Vocal, { songCount: 1 })

    const first = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`)
      .json(body)
    first.assertStatus(200)
    const second = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/sugerir`)
      .json(body)
    second.assertStatus(200)

    const schedule = await Schedule.query()
      .where('id', scheduleId)
      .preload('participants')
      .preload('songs')
      .firstOrFail()
    assert.equal(schedule.status, 'draft')
    assert.lengthOf(schedule.participants, 0)
    assert.lengthOf(schedule.songs, 0)
  })
})

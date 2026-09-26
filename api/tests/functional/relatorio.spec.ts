import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
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

test.group('Relatórios', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('rascunho não aumenta quem mais serve', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Ensaio',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      confirmationRequired: false,
    })
    created.assertStatus(201)
    const draft = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${created.body().id}`)
      .json({
        version: 1,
        title: 'Ensaio',
        startsAt: '2026-10-04T19:00',
        endsAt: null,
        notes: '',
        dressCode: '',
        confirmationRequired: false,
        participants: [{ membershipId: anaId, functionIds: [functions.Vocal] }],
        songs: [],
      })
    draft.assertStatus(200)

    const report = await client.get(
      `/api/ministerios/${ministryId}/relatorios?from=2026-10-01&to=2026-10-31`
    )
    report.assertStatus(200)
    assert.deepEqual(report.body().members, [])
    assert.deepEqual(
      report.body().idle.map((item: { name: string }) => item.name),
      ['Ana']
    )
  })

  test('duas funções no mesmo culto contam uma escala e duas atribuições', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal', 'Violão'])
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    await publish(client, ministryId, '2026-10-04T19:00', [
      { membershipId: anaId, functionIds: [functions.Vocal, functions['Violão']] },
    ])

    const report = await client.get(
      `/api/ministerios/${ministryId}/relatorios?from=2026-10-01&to=2026-10-31`
    )
    report.assertStatus(200)
    assert.deepEqual(report.body().members, [
      { membershipId: anaId, name: 'Ana', schedules: 1, assignments: 2 },
    ])
  })

  test('música excluída continua pelo título gravado', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const created = await client.post(`/api/ministerios/${ministryId}/musicas`).json({
      title: 'Grande é o Senhor',
      artist: 'Adhemar',
      bpm: null,
      durationSeconds: null,
      defaultKey: 'C',
      classificationId: null,
      folderId: null,
      versions: [{ name: 'Base', key: 'G' }],
      links: [],
    })
    created.assertStatus(201)
    await publish(
      client,
      ministryId,
      '2026-10-04T19:00',
      [],
      [{ songId: created.body().id, versionId: created.body().versions[0].id }]
    )

    const song = await Song.findOrFail(created.body().id)
    song.title = 'Renomeada'
    song.deletedAt = DateTime.utc()
    await song.save()

    const report = await client.get(
      `/api/ministerios/${ministryId}/relatorios?from=2026-10-01&to=2026-10-31`
    )
    report.assertStatus(200)
    assert.deepEqual(report.body().songs, [
      { title: 'Grande é o Senhor', artist: 'Adhemar', count: 1 },
    ])
  })

  test('membro comum recebe 404', async ({ client }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
    invite.assertStatus(201)
    await register(client, 'Bia', 'bia@igreja.com')
    const entered = await client
      .post('/api/convites/entrar')
      .json({ code: invite.body().invite.code })
    entered.assertStatus(200)
    await login(client, 'ana@igreja.com')
    const approved = await client.post(
      `/api/ministerios/${ministryId}/pedidos/${entered.body().membershipId}/aprovar`
    )
    approved.assertStatus(204)

    await login(client, 'bia@igreja.com')
    const overview = await client.get(`/api/ministerios/${ministryId}/relatorios/visao`)
    overview.assertStatus(404)
    overview.assertBodyContains({ message: 'Relatório não encontrado.' })
    const report = await client.get(
      `/api/ministerios/${ministryId}/relatorios?from=2026-10-01&to=2026-10-31`
    )
    report.assertStatus(404)
    const grid = await client.get(
      `/api/ministerios/${ministryId}/relatorios/panorama?month=2026-10`
    )
    grid.assertStatus(404)
  })

  test('culto no domingo 23h continua no domingo', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    await publish(client, ministryId, '2026-09-27T23:00', [
      { membershipId: anaId, functionIds: [functions.Vocal] },
    ])

    const grid = await client.get(
      `/api/ministerios/${ministryId}/relatorios/panorama?month=2026-09`
    )
    grid.assertStatus(200)
    assert.deepEqual(grid.body().days, ['2026-09-27'])
    assert.deepEqual(
      grid.body().rows[0].cells[0].people.map((item: { name: string }) => item.name),
      ['Ana']
    )
  })
})

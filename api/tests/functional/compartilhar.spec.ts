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

async function createSong(
  client: ApiClient,
  ministryId: string,
  title: string,
  defaultKey: string,
  versionKey: string
) {
  const created = await client.post(`/api/ministerios/${ministryId}/musicas`).json({
    title,
    artist: 'Adhemar',
    bpm: null,
    durationSeconds: null,
    defaultKey,
    classificationId: null,
    folderId: null,
    versions: [{ name: 'Base', key: versionKey }],
    links: [],
  })
  created.assertStatus(201)
  return {
    id: created.body().id as string,
    versionId: created.body().versions[0].id as string,
  }
}

async function publish(
  client: ApiClient,
  ministryId: string,
  startsAt: string,
  participants: { membershipId: string; functionIds: string[] }[],
  songs: { songId: string; versionId: string; keyOverride: string | null }[]
) {
  const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
    title: 'Culto',
    startsAt,
    endsAt: null,
    confirmationRequired: true,
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
      confirmationRequired: true,
      participants,
      songs: songs.map((song) => ({
        songId: song.songId,
        versionId: song.versionId,
        keyOverride: song.keyOverride,
        notes: '',
        highlights: [],
      })),
    })
  saved.assertStatus(200)
  return created.body().id as string
}

function svgOf(response: { body: () => unknown; text: () => string }) {
  const raw = response.body()
  if (typeof raw === 'string') {
    return raw
  }
  if (Buffer.isBuffer(raw)) {
    return raw.toString('utf8')
  }
  return response.text()
}

test.group('Compartilhar', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('o texto usa o fuso do ministério e o tom efetivo', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    const song = await createSong(client, ministryId, 'Grande é o Senhor', 'C', 'G')
    const scheduleId = await publish(
      client,
      ministryId,
      '2026-10-04T23:00',
      [{ membershipId: anaId, functionIds: [functions.Vocal] }],
      [{ songId: song.id, versionId: song.versionId, keyOverride: 'D' }]
    )
    const confirmed = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/confirmacao`)
      .json({ confirmation: 'confirmed' })
    confirmed.assertStatus(200)

    const before = await Schedule.findOrFail(scheduleId)
    const shared = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/texto`)
      .json({ preset: 'completa', bold: false })
    shared.assertStatus(200)
    assert.equal(
      shared.body().text,
      [
        'Culto',
        'domingo, 4 de outubro de 2026 · 23:00',
        'Louvor Domingo',
        '',
        'Equipe',
        'Vocal: Ana — Confirmado',
        '',
        'Músicas',
        '1. Grande é o Senhor — D',
      ].join('\n')
    )
    assert.notInclude(shared.body().text, '*')

    const bold = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/texto`)
      .json({ preset: 'completa', bold: true })
    bold.assertStatus(200)
    assert.include(bold.body().text, '*Culto*')
    assert.include(bold.body().text, '*Ana*')

    const image = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/imagem`)
      .json({})
    image.assertStatus(200)
    assert.include(image.header('content-type'), 'image/svg+xml')
    const svg = svgOf(image)
    assert.include(svg, 'font-family="sans-serif"')
    assert.include(svg, 'Ana')
    assert.include(svg, 'Grande é o Senhor')
    assert.include(svg, '— D')
    assert.include(svg, 'domingo, 4 de outubro de 2026')
    assert.notInclude(svg, 'segunda-feira')

    const after = await Schedule.findOrFail(scheduleId)
    assert.equal(after.status, before.status)
    assert.equal(after.version, before.version)
    const stored = await Song.findOrFail(song.id)
    assert.equal(stored.defaultKey, 'C')
  })

  test('membro comum não gera texto de rascunho', async ({ client }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    await approve(client, ministryId, ['Bia'])
    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Ensaio',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
    })
    created.assertStatus(201)

    await login(client, 'bia@igreja.com')
    const hidden = await client
      .post(`/api/ministerios/${ministryId}/escalas/${created.body().id}/texto`)
      .json({ preset: 'completa' })
    hidden.assertStatus(404)
    hidden.assertBodyContains({ message: 'Escala não encontrada.' })
  })

  test('apenas confirmados omite pendente e quem recusou', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    const ids = await approve(client, ministryId, ['Bia', 'Caio'])
    const scheduleId = await publish(
      client,
      ministryId,
      '2026-10-11T19:00',
      [
        { membershipId: anaId, functionIds: [functions.Vocal] },
        { membershipId: ids.Bia, functionIds: [functions.Vocal] },
        { membershipId: ids.Caio, functionIds: [functions.Vocal] },
      ],
      []
    )
    const confirmed = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/confirmacao`)
      .json({ confirmation: 'confirmed', membershipId: anaId })
    confirmed.assertStatus(200)
    const declined = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/confirmacao`)
      .json({ confirmation: 'declined', membershipId: ids.Bia })
    declined.assertStatus(200)

    const shared = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/texto`)
      .json({ preset: 'participantes', confirmedOnly: true, confirmations: true })
    shared.assertStatus(200)
    assert.include(shared.body().text, 'Ana')
    assert.notInclude(shared.body().text, 'Bia')
    assert.notInclude(shared.body().text, 'Caio')
  })

  test('a imagem longa avisa que a lista completa está no sistema', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, ['Vocal'])
    const songs = []
    for (let index = 1; index <= 13; index += 1) {
      const title = `Musica ${String(index).padStart(2, '0')}`
      songs.push(await createSong(client, ministryId, title, 'C', 'C'))
    }
    const scheduleId = await publish(
      client,
      ministryId,
      '2026-10-11T19:00',
      [],
      songs.map((song) => ({ songId: song.id, versionId: song.versionId, keyOverride: null }))
    )

    const shared = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/texto`)
      .json({ preset: 'musicas' })
    shared.assertStatus(200)
    assert.include(shared.body().text, 'Musica 13')

    const image = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/imagem`)
      .json({})
    image.assertStatus(200)
    const svg = svgOf(image)
    assert.include(svg, 'Musica 12')
    assert.include(svg, 'lista completa no sistema')
    assert.notInclude(svg, 'Musica 13')
  })
})

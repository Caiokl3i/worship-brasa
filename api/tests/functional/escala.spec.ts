import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import Song from '#models/song'
import SongVersion from '#models/song_version'
import ScheduleParticipant from '#models/schedule_participant'
import { effectiveKey } from '#schedules/effective_key'

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

async function createMinistry(client: ApiClient, name: string, functions = ['Vocal', 'Violão']) {
  const response = await client.post('/api/ministerios').json({ name, functions })
  response.assertStatus(201)
  return response.body().id as string
}

async function approve(client: ApiClient, ministryId: string, adminEmail: string, names: string[]) {
  const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
  invite.assertStatus(201)
  const code = invite.body().invite.code as string
  const ids: Record<string, string> = {}

  for (const name of names) {
    const email = `${name.toLowerCase()}@igreja.com`
    await register(client, name, email)
    const entered = await client.post('/api/convites/entrar').json({ code })
    entered.assertStatus(200)
    ids[name] = entered.body().membershipId as string
  }

  await login(client, adminEmail)
  for (const membershipId of Object.values(ids)) {
    const approved = await client.post(
      `/api/ministerios/${ministryId}/pedidos/${membershipId}/aprovar`
    )
    approved.assertStatus(204)
  }

  return ids
}

function songPayload(title: string, defaultKey: string, versionKey: string) {
  return {
    title,
    artist: 'Adhemar de Campos',
    bpm: 72,
    durationSeconds: 240,
    defaultKey,
    classificationId: null,
    folderId: null,
    versions: [{ name: 'Base', key: versionKey }],
    links: [
      { versionIndex: null, kind: 'cifra', label: 'Cifra', url: 'https://cifra.example/musica' },
    ],
  }
}

type SongRef = { id: string; versionId: string }

async function createSong(
  client: ApiClient,
  ministryId: string,
  title: string,
  defaultKey: string,
  versionKey: string
): Promise<SongRef> {
  const created = await client
    .post(`/api/ministerios/${ministryId}/musicas`)
    .json(songPayload(title, defaultKey, versionKey))
  created.assertStatus(201)
  return {
    id: created.body().id as string,
    versionId: created.body().versions[0].id as string,
  }
}

test.group('Escala', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('o tom efetivo usa o da escala, senão o da versão, senão o padrão', ({ assert }) => {
    assert.equal(effectiveKey({ keyOverride: 'D', versionKey: 'G', defaultKey: 'C' }), 'D')
    assert.equal(effectiveKey({ keyOverride: null, versionKey: 'G', defaultKey: 'C' }), 'G')
    assert.equal(effectiveKey({ keyOverride: null, versionKey: null, defaultKey: 'C' }), 'C')
    assert.equal(effectiveKey({ keyOverride: '', versionKey: '', defaultKey: '' }), '')
  })

  test('rascunho fica invisível até publicar, com equipe e músicas', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const ids = await approve(client, ministryId, 'ana@igreja.com', ['Bia', 'Caio', 'Davi'])

    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions
      .body()
      .functions.find((item: { name: string }) => item.name === 'Vocal').id as string
    const violaoId = functions
      .body()
      .functions.find((item: { name: string }) => item.name === 'Violão').id as string

    const primeira = await createSong(client, ministryId, 'Grande é o Senhor', 'C', 'G')
    const segunda = await createSong(client, ministryId, 'Quão Grande és Tu', 'D', 'A')
    const terceira = await createSong(client, ministryId, 'Oceanos', 'E', 'B')

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto de domingo',
      startsAt: '2026-10-04T19:00',
      endsAt: '2026-10-04T21:00',
      notes: 'Chegar 18h',
      dressCode: 'Preto',
    })
    created.assertStatus(201)
    created.assertBodyContains({ status: 'draft', version: 1, title: 'Culto de domingo' })
    assert.equal(created.body().startsAt, '2026-10-04T22:00:00.000Z')
    const scheduleId = created.body().id as string

    await login(client, 'caio@igreja.com')
    const hidden = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    hidden.assertStatus(404)
    hidden.assertBodyContains({ message: 'Escala não encontrada.' })
    assert.notInclude(JSON.stringify(hidden.body()), 'Culto de domingo')

    const hiddenList = await client.get(`/api/ministerios/${ministryId}/escalas`)
    hiddenList.assertStatus(200)
    assert.notInclude(JSON.stringify(hiddenList.body()), 'Culto de domingo')

    await login(client, 'ana@igreja.com')
    const outsider = '00000000-0000-4000-8000-000000000099'
    const rejected = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
      .json({
        version: 1,
        title: 'Culto de domingo',
        startsAt: '2026-10-04T19:00',
        endsAt: '2026-10-04T21:00',
        notes: 'Chegar 18h',
        dressCode: 'Preto',
        participants: [{ membershipId: outsider, functionIds: [vocalId] }],
        songs: [],
      })
    rejected.assertStatus(422)

    const highlight = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
      .json({
        version: 1,
        title: 'Culto de domingo',
        startsAt: '2026-10-04T19:00',
        endsAt: '2026-10-04T21:00',
        notes: 'Chegar 18h',
        dressCode: 'Preto',
        participants: [{ membershipId: anaId, functionIds: [vocalId] }],
        songs: [
          {
            songId: primeira.id,
            versionId: primeira.versionId,
            keyOverride: null,
            notes: '',
            highlights: [{ membershipId: ids.Bia, functionId: vocalId }],
          },
        ],
      })
    highlight.assertStatus(422)
    highlight.assertBodyContains({
      errors: [{ field: 'highlights', message: 'O destaque precisa ser de alguém da equipe.' }],
    })

    const saved = await client.patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`).json({
      version: 1,
      title: 'Culto de domingo',
      startsAt: '2026-10-04T19:00',
      endsAt: '2026-10-04T21:00',
      notes: 'Chegar 18h',
      dressCode: 'Preto',
      participants: [
        { membershipId: anaId, functionIds: [vocalId, violaoId] },
        { membershipId: ids.Bia, functionIds: [vocalId] },
        { membershipId: ids.Caio, functionIds: [violaoId] },
        { membershipId: ids.Davi, functionIds: [vocalId] },
      ],
      songs: [
        {
          songId: primeira.id,
          versionId: primeira.versionId,
          keyOverride: 'D',
          notes: 'Entrada',
          highlights: [{ membershipId: anaId, functionId: violaoId }],
        },
        {
          songId: segunda.id,
          versionId: segunda.versionId,
          keyOverride: null,
          notes: '',
          highlights: [],
        },
        {
          songId: terceira.id,
          versionId: null,
          keyOverride: null,
          notes: '',
          highlights: [],
        },
      ],
    })
    saved.assertStatus(200)
    saved.assertBodyContains({ status: 'draft', version: 2 })
    assert.lengthOf(saved.body().participants, 4)
    const ana = saved.body().participants.find((item: { name: string }) => item.name === 'Ana')
    assert.deepEqual(ana.functions.map((item: { name: string }) => item.name).sort(), [
      'Violão',
      'Vocal',
    ])
    assert.equal(saved.body().songs[0].effectiveKey, 'D')
    assert.equal(saved.body().songs[0].keyOverride, 'D')
    assert.equal(saved.body().songs[1].effectiveKey, 'A')
    assert.equal(saved.body().songs[2].effectiveKey, 'E')
    assert.equal(saved.body().songs[0].position, 1)
    assert.equal(saved.body().songs[0].links[0].url, 'https://cifra.example/musica')
    assert.deepEqual(saved.body().songs[0].highlights, [
      { membershipId: anaId, functionId: violaoId },
    ])

    const song = await Song.findOrFail(primeira.id)
    const version = await SongVersion.findOrFail(primeira.versionId)
    assert.equal(song.defaultKey, 'C')
    assert.equal(version.key, 'G')

    await login(client, 'caio@igreja.com')
    const stillHidden = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    stillHidden.assertStatus(404)

    await login(client, 'ana@igreja.com')
    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/publicar`)
      .json({
        version: 2,
        title: 'Culto de domingo',
        startsAt: '2026-10-04T19:00',
        endsAt: '2026-10-04T21:00',
        notes: 'Chegar 18h',
        dressCode: 'Preto',
        participants: [
          { membershipId: anaId, functionIds: [vocalId, violaoId] },
          { membershipId: ids.Bia, functionIds: [vocalId] },
          { membershipId: ids.Caio, functionIds: [violaoId] },
          { membershipId: ids.Davi, functionIds: [vocalId] },
        ],
        songs: [
          {
            songId: primeira.id,
            versionId: primeira.versionId,
            keyOverride: 'D',
            notes: 'Entrada',
            highlights: [{ membershipId: anaId, functionId: violaoId }],
          },
          {
            songId: segunda.id,
            versionId: segunda.versionId,
            keyOverride: null,
            notes: '',
            highlights: [],
          },
          {
            songId: terceira.id,
            versionId: null,
            keyOverride: null,
            notes: '',
            highlights: [],
          },
        ],
      })
    published.assertStatus(200)
    published.assertBodyContains({ status: 'published', version: 3 })

    await login(client, 'caio@igreja.com')
    const visible = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    visible.assertStatus(200)
    visible.assertBodyContains({
      title: 'Culto de domingo',
      status: 'published',
      songs: [{ effectiveKey: 'D' }, { effectiveKey: 'A' }, { effectiveKey: 'E' }],
    })
    assert.lengthOf(visible.body().participants, 4)
  })

  test('duas gravações com a mesma versão: a segunda falha e a primeira permanece', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Ensaio',
      startsAt: '2026-10-03T20:00',
    })
    created.assertStatus(201)
    const scheduleId = created.body().id as string
    const payload = {
      version: 1,
      title: 'Ensaio da banda',
      startsAt: '2026-10-03T20:00',
      endsAt: null,
      notes: '',
      dressCode: '',
      participants: [],
      songs: [],
    }

    const first = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
      .json(payload)
    first.assertStatus(200)
    first.assertBodyContains({ title: 'Ensaio da banda', version: 2, status: 'draft' })

    const second = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
      .json({ ...payload, title: 'Título perdido' })
    second.assertStatus(409)
    second.assertBodyContains({ message: 'Esta escala foi alterada, reabra.' })

    const opened = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    opened.assertStatus(200)
    opened.assertBodyContains({ title: 'Ensaio da banda', version: 2, status: 'draft' })
    assert.notInclude(JSON.stringify(opened.body()), 'Título perdido')
  })

  test('quem só edita músicas reordena e não muda a equipe', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const ids = await approve(client, ministryId, 'ana@igreja.com', ['Bia'])
    const flags = await client
      .patch(`/api/ministerios/${ministryId}/membros/${ids.Bia}`)
      .json({ canEditScheduleSongs: true })
    flags.assertStatus(204)

    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string
    const primeira = await createSong(client, ministryId, 'Grande é o Senhor', 'C', 'G')
    const segunda = await createSong(client, ministryId, 'Quão Grande és Tu', 'D', 'A')

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T19:00',
    })
    const scheduleId = created.body().id as string
    const songs = [
      {
        songId: primeira.id,
        versionId: primeira.versionId,
        keyOverride: null,
        notes: '',
        highlights: [],
      },
      {
        songId: segunda.id,
        versionId: segunda.versionId,
        keyOverride: null,
        notes: '',
        highlights: [],
      },
    ]
    const team = [{ membershipId: anaId, functionIds: [vocalId] }]
    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/publicar`)
      .json({
        version: 1,
        title: 'Culto',
        startsAt: '2026-10-04T19:00',
        endsAt: null,
        notes: '',
        dressCode: '',
        participants: team,
        songs,
      })
    published.assertStatus(200)

    await login(client, 'bia@igreja.com')
    const draftAttempt = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Outra',
      startsAt: '2026-10-05T19:00',
    })
    draftAttempt.assertStatus(403)

    const publishAttempt = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/publicar`)
      .json({
        version: published.body().version,
        title: 'Culto',
        startsAt: published.body().startsAt,
        endsAt: null,
        notes: '',
        dressCode: '',
        participants: team,
        songs,
      })
    publishAttempt.assertStatus(403)

    const teamAttempt = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
      .json({
        version: published.body().version,
        title: 'Culto',
        startsAt: published.body().startsAt,
        endsAt: null,
        notes: '',
        dressCode: '',
        participants: [{ membershipId: ids.Bia, functionIds: [vocalId] }],
        songs,
      })
    teamAttempt.assertStatus(403)
    teamAttempt.assertBodyContains({ message: 'Você não pode fazer isso.' })

    const reordered = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
      .json({
        version: published.body().version,
        title: 'Culto',
        startsAt: published.body().startsAt,
        endsAt: null,
        notes: '',
        dressCode: '',
        participants: team,
        songs: [songs[1], songs[0]],
      })
    reordered.assertStatus(200)
    assert.equal(reordered.body().songs[0].songId, segunda.id)
    assert.equal(reordered.body().songs[1].songId, primeira.id)
    assert.equal(reordered.body().status, 'published')
    assert.equal(reordered.body().participants[0].membershipId, anaId)
  })

  test('escala de outro ministério não aparece e o corpo não traz o título', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryA = await createMinistry(client, 'Louvor Ágape')
    const created = await client.post(`/api/ministerios/${ministryA}/escalas`).json({
      title: 'Culto secreto',
      startsAt: '2026-10-04T19:00',
    })
    created.assertStatus(201)
    const scheduleId = created.body().id as string
    await client.post(`/api/ministerios/${ministryA}/escalas/${scheduleId}/publicar`).json({
      version: 1,
      title: 'Culto secreto',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      notes: '',
      dressCode: '',
      participants: [],
      songs: [],
    })

    await register(client, 'Bia', 'bia@igreja.com')
    const ministryB = await createMinistry(client, 'Recepção')
    const leaked = await client.get(`/api/ministerios/${ministryA}/escalas/${scheduleId}`)
    leaked.assertStatus(404)
    leaked.assertBodyContains({ message: 'Ministério não encontrado.' })
    assert.notInclude(JSON.stringify(leaked.body()), 'Culto secreto')

    const list = await client.get(`/api/ministerios/${ministryB}/escalas`)
    list.assertStatus(200)
    assert.notInclude(JSON.stringify(list.body()), 'Culto secreto')
  })

  test('excluir some da lista e deixa a equipe no banco', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string

    const past = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto antigo',
      startsAt: '2020-01-01T19:00',
    })
    const future = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto novo',
      startsAt: '2027-01-01T19:00',
    })
    const scheduleId = future.body().id as string
    await client.patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`).json({
      version: 1,
      title: 'Culto novo',
      startsAt: '2027-01-01T19:00',
      endsAt: null,
      notes: '',
      dressCode: '',
      participants: [{ membershipId: anaId, functionIds: [vocalId] }],
      songs: [],
    })

    const list = await client.get(`/api/ministerios/${ministryId}/escalas`)
    list.assertStatus(200)
    assert.deepEqual(
      list.body().upcoming.map((item: { title: string }) => item.title),
      ['Culto novo']
    )
    assert.deepEqual(
      list.body().past.map((item: { title: string }) => item.title),
      ['Culto antigo']
    )

    const removed = await client.delete(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    removed.assertStatus(204)
    const gone = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    gone.assertStatus(404)

    const kept = await ScheduleParticipant.query().where('scheduleId', scheduleId)
    assert.lengthOf(kept, 1)
  })
})

import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'

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

async function createMinistry(client: ApiClient) {
  const response = await client
    .post('/api/ministerios')
    .json({ name: 'Louvor Domingo', functions: ['Vocal'] })
  response.assertStatus(201)
  return response.body().id as string
}

async function createSong(client: ApiClient, ministryId: string, title: string) {
  const created = await client.post(`/api/ministerios/${ministryId}/musicas`).json({
    title,
    artist: null,
    bpm: null,
    durationSeconds: null,
    defaultKey: 'C',
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

function songRow(
  song: { id: string; versionId: string },
  notes: string,
  durationSeconds: number | null
) {
  return {
    songId: song.id,
    versionId: song.versionId,
    keyOverride: 'D',
    notes,
    durationSeconds,
    highlights: [],
  }
}

function scheduleBody(version: number, startsAt: string, songs: ReturnType<typeof songRow>[]) {
  return {
    version,
    title: 'Culto de domingo',
    startsAt,
    endsAt: null,
    notes: '',
    dressCode: '',
    confirmationRequired: true,
    participants: [],
    songs,
  }
}

test.group('Roteiro', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('membro vê o roteiro publicado, o modelo não apaga as músicas e não altera o culto copiado', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
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

    const primeira = await createSong(client, ministryId, 'Grande é o Senhor')
    const segunda = await createSong(client, ministryId, 'Oceanos')
    const draft = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Rascunho',
      startsAt: '2026-10-11T19:00',
      endsAt: null,
      notes: '',
      dressCode: '',
    })
    draft.assertStatus(201)

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto de domingo',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      notes: '',
      dressCode: '',
    })
    created.assertStatus(201)
    const scheduleId = created.body().id as string

    const templates = await client.get(`/api/ministerios/${ministryId}/roteiros`)
    templates.assertStatus(200)
    const culto = templates.body().templates.find((item: { name: string }) => item.name === 'Culto')
    assert.exists(culto)

    const withSongs = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
      .json(
        scheduleBody(1, '2026-10-04T19:00', [
          songRow(primeira, 'entrada', 120),
          songRow(segunda, '', null),
        ])
      )
    withSongs.assertStatus(200)

    const applied = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/roteiro/aplicar`)
      .json({ version: withSongs.body().version, templateId: culto.id })
    applied.assertStatus(200)
    assert.deepEqual(
      applied.body().script.items.map((item: { title: string }) => item.title),
      [
        'Abertura',
        'Oração',
        'Boas-vindas',
        'Grande é o Senhor',
        'Oceanos',
        'Palavra',
        'Oferta',
        'Avisos',
        'Encerramento',
      ]
    )
    assert.equal(applied.body().script.totalDurationSeconds, 120)
    const locked = applied
      .body()
      .script.items.find((item: { title: string }) => item.title === 'Grande é o Senhor')
    assert.equal(locked.effectiveKey, 'D')
    assert.equal(locked.notes, 'entrada')
    assert.isTrue(locked.locked)

    const renamed = culto.items.map(
      (item: { title: string; notes: string; durationSeconds: number | null }) =>
        item.title === 'Oração' ? { ...item, title: 'Começo' } : item
    )
    const edited = await client.patch(`/api/ministerios/${ministryId}/roteiros/${culto.id}`).json({
      name: 'Culto',
      items: renamed.map(
        (item: { title: string; notes: string; durationSeconds: number | null }) => ({
          title: item.title,
          notes: item.notes,
          durationSeconds: item.durationSeconds,
        })
      ),
    })
    edited.assertStatus(200)

    const still = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    still.assertStatus(200)
    assert.include(
      still.body().script.items.map((item: { title: string }) => item.title),
      'Oração'
    )
    assert.notInclude(
      still.body().script.items.map((item: { title: string }) => item.title),
      'Começo'
    )

    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/publicar`)
      .json(
        scheduleBody(still.body().version, '2026-10-04T19:00', [
          songRow(primeira, 'entrada', 120),
          songRow(segunda, '', null),
        ])
      )
    published.assertStatus(200)

    await login(client, 'bia@igreja.com')
    const hidden = await client.get(`/api/ministerios/${ministryId}/escalas/${draft.body().id}`)
    hidden.assertStatus(404)

    const seen = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    seen.assertStatus(200)
    assert.include(
      seen.body().script.items.map((item: { title: string }) => item.title),
      'Grande é o Senhor'
    )

    const denied = await client
      .put(`/api/ministerios/${ministryId}/escalas/${scheduleId}/roteiro`)
      .json({
        version: seen.body().version,
        items: [{ title: 'Abertura', notes: '', durationSeconds: null }],
      })
    denied.assertStatus(403)
    denied.assertBodyContains({ message: 'Você não pode fazer isso.' })
  })

  test('ocorrência nova da série nasce com abertura e palavra', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto de domingo',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      notes: '',
      dressCode: '',
      repeat: {
        frequency: 'weekly',
        interval: 1,
        weekdays: [7],
        endsMode: 'after_count',
        occurrenceCount: 2,
      },
    })
    created.assertStatus(201)
    const titles = created.body().script.items.map((item: { title: string }) => item.title)
    assert.include(titles, 'Abertura')
    assert.include(titles, 'Palavra')

    const templates = await client.get(`/api/ministerios/${ministryId}/roteiros`)
    const culto = templates.body().templates.find((item: { name: string }) => item.name === 'Culto')
    const edited = await client.patch(`/api/ministerios/${ministryId}/roteiros/${culto.id}`).json({
      name: 'Culto',
      items: culto.items.map(
        (item: { title: string; notes: string; durationSeconds: number | null }) => ({
          title: item.title === 'Abertura' ? 'Começo' : item.title,
          notes: item.notes,
          durationSeconds: item.durationSeconds,
        })
      ),
    })
    edited.assertStatus(200)

    const again = await client.get(`/api/ministerios/${ministryId}/escalas/${created.body().id}`)
    again.assertStatus(200)
    const kept = again.body().script.items.map((item: { title: string }) => item.title)
    assert.include(kept, 'Abertura')
    assert.notInclude(kept, 'Começo')

    const sibling = created
      .body()
      .series.upcoming.find((item: { id: string }) => item.id !== created.body().id)
    const other = await client.get(`/api/ministerios/${ministryId}/escalas/${sibling.id}`)
    other.assertStatus(200)
    assert.include(
      other.body().script.items.map((item: { title: string }) => item.title),
      'Abertura'
    )
  })
})

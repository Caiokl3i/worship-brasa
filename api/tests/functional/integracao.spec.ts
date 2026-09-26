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

async function createMinistry(client: ApiClient, name: string) {
  const response = await client.post('/api/ministerios').json({
    name,
    functions: ['Vocal'],
  })
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

async function createSong(client: ApiClient, ministryId: string) {
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
  return {
    id: created.body().id as string,
    versionId: created.body().versions[0].id as string,
  }
}

async function issueToken(client: ApiClient, ministryId: string) {
  const created = await client.post(`/api/ministerios/${ministryId}/integracao`)
  created.assertStatus(201)
  return created.body().token as string
}

test.group('Integração', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('o token lê o tom efetivo e o rascunho não sai', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Domingo')
    const otherId = await createMinistry(client, 'Outro louvor')
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    const song = await createSong(client, ministryId)

    const draft = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Ensaio',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      confirmationRequired: false,
    })
    draft.assertStatus(201)

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T23:00',
      endsAt: null,
      confirmationRequired: false,
    })
    created.assertStatus(201)
    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${created.body().id}/publicar`)
      .json({
        version: 1,
        title: 'Culto',
        startsAt: '2026-10-04T23:00',
        endsAt: null,
        notes: '',
        dressCode: '',
        confirmationRequired: false,
        participants: [{ membershipId: anaId, functionIds: [functions.Vocal] }],
        songs: [
          {
            songId: song.id,
            versionId: song.versionId,
            keyOverride: 'D',
            notes: '',
            highlights: [],
          },
        ],
      })
    published.assertStatus(200)

    const token = await issueToken(client, ministryId)
    const listed = await client.get(`/api/ministerios/${ministryId}/integracao`)
    listed.assertStatus(200)
    assert.equal(listed.body().token.prefix, token.slice(0, 8))
    assert.notProperty(listed.body().token, 'token')

    const opened = await client
      .get(`/api/integracao/escalas/${created.body().id}`)
      .header('authorization', `Bearer ${token}`)
    opened.assertStatus(200)
    assert.equal(opened.body().songs[0].key, 'D')
    assert.equal(opened.body().team[0].name, 'Ana')
    assert.include(opened.body().startsAt, '2026-10-04T23:00')

    const range = await client
      .get('/api/integracao/escalas?from=2026-10-01&to=2026-10-31')
      .header('authorization', `Bearer ${token}`)
    range.assertStatus(200)
    const titles = range.body().schedules.map((item: { title: string }) => item.title)
    assert.deepEqual(titles, ['Culto'])

    const hidden = await client
      .get(`/api/integracao/escalas/${draft.body().id}`)
      .header('authorization', `Bearer ${token}`)
    hidden.assertStatus(404)
    hidden.assertBodyContains({ message: 'Escala não encontrada.' })

    const otherToken = await issueToken(client, otherId)
    const leaked = await client
      .get(`/api/integracao/escalas/${created.body().id}`)
      .header('authorization', `Bearer ${otherToken}`)
    leaked.assertStatus(404)

    const replaced = await issueToken(client, ministryId)
    const stale = await client
      .get(`/api/integracao/escalas/${created.body().id}`)
      .header('authorization', `Bearer ${token}`)
    stale.assertStatus(401)

    const revoked = await client.delete(`/api/ministerios/${ministryId}/integracao`)
    revoked.assertStatus(204)
    const again = await client
      .get(`/api/integracao/escalas/${created.body().id}`)
      .header('authorization', `Bearer ${replaced}`)
    again.assertStatus(401)
  })
})

import { test } from '@japa/runner'
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

async function createMinistry(client: ApiClient, name: string) {
  const response = await client.post('/api/ministerios').json({ name, functions: ['Vocal'] })
  response.assertStatus(201)
  return response.body().id as string
}

function songPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Grande é o Senhor',
    artist: 'Adhemar de Campos',
    bpm: 72,
    durationSeconds: 240,
    defaultKey: 'C',
    classificationId: null,
    folderId: null,
    versions: [
      { name: 'Base', key: 'G' },
      { name: 'Ministro', key: 'A' },
    ],
    links: [],
    ...overrides,
  }
}

test.group('Repertório', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('duas versões reabrem com os tons intactos e o tom padrão igual', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')

    const seeded = await client.get(`/api/ministerios/${ministryId}/classificacoes`)
    seeded.assertStatus(200)
    assert.deepEqual(
      seeded.body().classifications.map((item: { name: string }) => item.name),
      ['Adoração', 'Alegria', 'Consagração', 'Contemplação', 'Louvor', 'Especiais']
    )

    const created = await client.post(`/api/ministerios/${ministryId}/musicas`).json(songPayload())
    created.assertStatus(201)
    created.assertBodyContains({
      title: 'Grande é o Senhor',
      defaultKey: 'C',
      versions: [
        { name: 'Base', key: 'G' },
        { name: 'Ministro', key: 'A' },
      ],
    })

    const opened = await client.get(`/api/ministerios/${ministryId}/musicas/${created.body().id}`)
    opened.assertStatus(200)
    opened.assertBodyContains({
      defaultKey: 'C',
      versions: [
        { name: 'Base', key: 'G' },
        { name: 'Ministro', key: 'A' },
      ],
    })
  })

  test('membro sem permissão lista e não grava', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const created = await client.post(`/api/ministerios/${ministryId}/musicas`).json(songPayload())
    created.assertStatus(201)
    const songId = created.body().id as string

    const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
    const code = invite.body().invite.code as string
    await register(client, 'Bia', 'bia@igreja.com')
    const entered = await client.post('/api/convites/entrar').json({ code })
    const membershipId = entered.body().membershipId as string

    await login(client, 'ana@igreja.com')
    await client.post(`/api/ministerios/${ministryId}/pedidos/${membershipId}/aprovar`)

    await login(client, 'bia@igreja.com')
    const list = await client.get(`/api/ministerios/${ministryId}/musicas`)
    list.assertStatus(200)
    list.assertBodyContains({ songs: [{ title: 'Grande é o Senhor' }] })

    const denied = await client
      .post(`/api/ministerios/${ministryId}/musicas`)
      .json(songPayload({ title: 'Outra música' }))
    denied.assertStatus(403)
    denied.assertBodyContains({ message: 'Você não pode fazer isso.' })

    const edited = await client
      .patch(`/api/ministerios/${ministryId}/musicas/${songId}`)
      .json(songPayload({ title: 'Título trocado' }))
    edited.assertStatus(403)

    const removed = await client.delete(`/api/ministerios/${ministryId}/musicas/${songId}`)
    removed.assertStatus(403)

    const still = await Song.findOrFail(songId)
    assert.equal(still.title, 'Grande é o Senhor')
    assert.isNull(still.deletedAt)
  })

  test('tom inválido e link que não é url não gravam', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')

    const badKey = await client
      .post(`/api/ministerios/${ministryId}/musicas`)
      .json(songPayload({ title: 'Tom inválido', defaultKey: 'H' }))
    badKey.assertStatus(422)
    badKey.assertBodyContains({
      errors: [{ field: 'defaultKey', message: 'Informe um tom da lista.' }],
    })

    const badUrl = await client.post(`/api/ministerios/${ministryId}/musicas`).json(
      songPayload({
        title: 'Link inválido',
        links: [{ versionIndex: null, kind: 'cifra', label: 'Cifra', url: 'não é um link' }],
      })
    )
    badUrl.assertStatus(422)
    badUrl.assertBodyContains({
      errors: [{ field: 'url', message: 'Informe um link http ou https.' }],
    })

    const unnamed = await client
      .post(`/api/ministerios/${ministryId}/musicas`)
      .json(songPayload({ versions: [{ name: ' ', key: 'G' }] }))
    unnamed.assertStatus(422)

    assert.isNull(await Song.findBy('title', 'Tom inválido'))
    assert.isNull(await Song.findBy('title', 'Link inválido'))
  })

  test('música de um ministério não aparece na busca do outro', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryA = await createMinistry(client, 'Louvor Ágape')
    const created = await client
      .post(`/api/ministerios/${ministryA}/musicas`)
      .json(songPayload({ title: 'Canção do Ágape', artist: 'Ana' }))
    created.assertStatus(201)
    const songId = created.body().id as string

    await register(client, 'Bia', 'bia@igreja.com')
    const ministryB = await createMinistry(client, 'Louvor Betel')

    const search = await client.get(
      `/api/ministerios/${ministryB}/musicas?q=${encodeURIComponent('Canção do Ágape')}`
    )
    search.assertStatus(200)
    assert.deepEqual(search.body().songs, [])
    assert.notInclude(JSON.stringify(search.body()), 'Canção do Ágape')
    assert.notInclude(JSON.stringify(search.body()), 'Louvor Ágape')

    const foreign = await client.get(`/api/ministerios/${ministryB}/musicas/${songId}`)
    foreign.assertStatus(404)
    foreign.assertBodyContains({ message: 'Música não encontrada.' })
    assert.notInclude(JSON.stringify(foreign.body()), 'Canção do Ágape')

    const otherMinistry = await client.get(`/api/ministerios/${ministryA}/musicas`)
    otherMinistry.assertStatus(404)
    assert.notInclude(JSON.stringify(otherMinistry.body()), 'Canção do Ágape')
  })

  test('excluir tira da lista e preenche deletedAt', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const created = await client
      .post(`/api/ministerios/${ministryId}/musicas`)
      .json(songPayload({ title: 'Música antiga' }))
    const songId = created.body().id as string

    const removed = await client.delete(`/api/ministerios/${ministryId}/musicas/${songId}`)
    removed.assertStatus(204)

    const list = await client.get(`/api/ministerios/${ministryId}/musicas?q=antiga`)
    list.assertStatus(200)
    assert.deepEqual(list.body().songs, [])

    const opened = await client.get(`/api/ministerios/${ministryId}/musicas/${songId}`)
    opened.assertStatus(404)

    const row = await Song.findOrFail(songId)
    assert.isNotNull(row.deletedAt)
    assert.equal(row.title, 'Música antiga')
  })

  test('excluir a pasta tira a música da pasta e mantém a música', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const folder = await client
      .post(`/api/ministerios/${ministryId}/pastas`)
      .json({ name: 'Domingo' })
    folder.assertStatus(201)

    const created = await client.post(`/api/ministerios/${ministryId}/musicas`).json(
      songPayload({
        folderId: folder.body().id,
        links: [
          {
            versionIndex: 0,
            kind: 'cifra',
            label: 'Cifra',
            url: 'https://exemplo.com/cifra',
          },
        ],
      })
    )
    created.assertStatus(201)
    assert.equal(created.body().folder.name, 'Domingo')
    assert.equal(created.body().links[0].versionId, created.body().versions[0].id)

    const removed = await client.delete(`/api/ministerios/${ministryId}/pastas/${folder.body().id}`)
    removed.assertStatus(204)

    const opened = await client.get(`/api/ministerios/${ministryId}/musicas/${created.body().id}`)
    opened.assertStatus(200)
    assert.isNull(opened.body().folder)
    assert.equal(opened.body().title, 'Grande é o Senhor')
  })
})

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

const sheet = [
  'título,artista,tom,BPM,classificação,link de cifra,link de vídeo',
  'Grande é o Senhor,Adhemar,D,72,,,',
  'Nova,Ana,C,90,,,',
].join('\n')

test.group('Planilha do repertório', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a prévia não grava e a importação não duplica o que está ativo', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministry = await client.post('/api/ministerios').json({
      name: 'Louvor Domingo',
      functions: ['Vocal'],
    })
    const ministryId = ministry.body().id as string
    const created = await client.post(`/api/ministerios/${ministryId}/musicas`).json({
      title: 'Grande é o Senhor',
      artist: 'Adhemar',
      bpm: null,
      durationSeconds: null,
      defaultKey: 'C',
      classificationId: null,
      folderId: null,
      versions: [],
      links: [],
    })
    created.assertStatus(201)
    const removed = await client.post(`/api/ministerios/${ministryId}/musicas`).json({
      title: 'Arquivada',
      artist: null,
      bpm: null,
      durationSeconds: null,
      defaultKey: null,
      classificationId: null,
      folderId: null,
      versions: [],
      links: [],
    })
    const deleted = await client.delete(
      `/api/ministerios/${ministryId}/musicas/${removed.body().id}`
    )
    deleted.assertStatus(204)

    const before = await Song.query().where('ministryId', ministryId).whereNull('deletedAt')
    const preview = await client
      .post(`/api/ministerios/${ministryId}/repertorio/previa`)
      .json({ csv: sheet })
    preview.assertStatus(200)
    assert.deepEqual(
      preview.body().rows.map((row: { title: string; action: string }) => [row.title, row.action]),
      [
        ['Grande é o Senhor', 'ignorar'],
        ['Nova', 'criar'],
      ]
    )
    assert.lengthOf(
      await Song.query().where('ministryId', ministryId).whereNull('deletedAt'),
      before.length
    )

    const imported = await client
      .post(`/api/ministerios/${ministryId}/repertorio/importar`)
      .json({ csv: sheet })
    imported.assertStatus(200)
    assert.equal(imported.body().created, 1)
    const again = await client
      .post(`/api/ministerios/${ministryId}/repertorio/importar`)
      .json({ csv: sheet })
    again.assertStatus(200)
    assert.equal(again.body().created, 0)

    const exported = await client.get(`/api/ministerios/${ministryId}/repertorio/exportar`)
    exported.assertStatus(200)
    const csv = exported.text()
    assert.include(csv, 'Nova')
    assert.notInclude(csv, 'Arquivada')

    const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
    await register(client, 'Bia', 'bia@igreja.com')
    const entered = await client
      .post('/api/convites/entrar')
      .json({ code: invite.body().invite.code })
    await login(client, 'ana@igreja.com')
    const approved = await client.post(
      `/api/ministerios/${ministryId}/pedidos/${entered.body().membershipId}/aprovar`
    )
    approved.assertStatus(204)
    await login(client, 'bia@igreja.com')
    const denied = await client
      .post(`/api/ministerios/${ministryId}/repertorio/previa`)
      .json({ csv: sheet })
    denied.assertStatus(403)
  })
})

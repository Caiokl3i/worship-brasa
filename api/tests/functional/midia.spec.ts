import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

const password = 'senha-segura'

test.group('Ministério sem música', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('mídia segue com escala e equipe e o repertório responde 404', async ({
    client,
    assert,
  }) => {
    const account = await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })
    account.assertStatus(201)

    const media = await client.post('/api/ministerios').json({
      name: 'Mídia Domingo',
      functions: ['Projeção', 'Som', 'Transmissão', 'Iluminação', 'Câmera'],
      musicModuleEnabled: false,
    })
    media.assertStatus(201)
    assert.isFalse(media.body().musicModuleEnabled)
    const ministryId = media.body().id as string

    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    functions.assertStatus(200)
    assert.deepEqual(
      functions.body().functions.map((item: { name: string }) => item.name),
      ['Projeção', 'Som', 'Transmissão', 'Iluminação', 'Câmera']
    )

    const songs = await client.get(`/api/ministerios/${ministryId}/musicas`)
    songs.assertStatus(404)
    const songReport = await client.get(
      `/api/ministerios/${ministryId}/relatorios?from=2026-10-01&to=2026-10-31`
    )
    songReport.assertStatus(200)
    assert.isNull(songReport.body().songs)

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      confirmationRequired: false,
    })
    created.assertStatus(201)
    const notices = await client.get(`/api/ministerios/${ministryId}/avisos`)
    notices.assertStatus(200)

    const worship = await client.post('/api/ministerios').json({
      name: 'Louvor Domingo',
      functions: ['Vocal'],
    })
    worship.assertStatus(201)
    assert.isTrue(worship.body().musicModuleEnabled)
  })
})

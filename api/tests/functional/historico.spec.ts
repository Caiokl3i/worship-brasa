import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import ScheduleChange from '#models/schedule_change'

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

test.group('Histórico da escala', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('grava o resumo na mesma resposta e esconde o rascunho', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const createdMinistry = await client.post('/api/ministerios').json({
      name: 'Louvor Domingo',
      functions: ['Vocal'],
    })
    const ministryId = createdMinistry.body().id as string
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const functionId = functions.body().functions[0].id as string
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string
    const song = await client.post(`/api/ministerios/${ministryId}/musicas`).json({
      title: 'Grande é o Senhor',
      artist: null,
      bpm: null,
      durationSeconds: null,
      defaultKey: 'C',
      classificationId: null,
      folderId: null,
      versions: [],
      links: [],
    })
    song.assertStatus(201)

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      confirmationRequired: false,
    })
    created.assertStatus(201)
    const scheduleId = created.body().id as string
    assert.lengthOf(created.body().changes, 0)

    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/publicar`)
      .json({
        version: 1,
        title: 'Culto',
        startsAt: '2026-10-04T19:00',
        endsAt: null,
        notes: '',
        dressCode: '',
        confirmationRequired: false,
        participants: [{ membershipId: anaId, functionIds: [functionId] }],
        songs: [
          {
            songId: song.body().id,
            versionId: null,
            keyOverride: null,
            notes: '',
            highlights: [],
          },
        ],
      })
    published.assertStatus(200)
    assert.include(published.body().changes[0].summary, 'Publicada')
    assert.include(published.body().changes[0].summary, 'Equipe')
    assert.include(published.body().changes[0].summary, 'Músicas')
    assert.notProperty(published.body().changes[0], 'songs')
    const afterPublish = await ScheduleChange.query().where('scheduleId', scheduleId)

    const stale = await client.patch(`/api/ministerios/${ministryId}/escalas/${scheduleId}`).json({
      version: 1,
      title: 'Culto',
      startsAt: '2026-10-04T20:00',
      endsAt: null,
      notes: '',
      dressCode: '',
      confirmationRequired: false,
      participants: [{ membershipId: anaId, functionIds: [functionId] }],
      songs: [],
    })
    stale.assertStatus(409)
    assert.lengthOf(
      await ScheduleChange.query().where('scheduleId', scheduleId),
      afterPublish.length
    )

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
    const draft = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Ensaio',
      startsAt: '2026-10-11T19:00',
      endsAt: null,
      confirmationRequired: false,
    })
    draft.assertStatus(201)

    await login(client, 'bia@igreja.com')
    const visible = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}`)
    visible.assertStatus(200)
    assert.include(visible.body().changes[0].summary, 'Publicada')
    const hidden = await client.get(`/api/ministerios/${ministryId}/escalas/${draft.body().id}`)
    hidden.assertStatus(404)
  })
})

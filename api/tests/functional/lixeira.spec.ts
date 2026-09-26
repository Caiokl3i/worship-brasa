import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import Schedule from '#models/schedule'
import Song from '#models/song'
import { countExpiredTrash } from '#services/trash_review'

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
  const response = await client.post('/api/ministerios').json({
    name: 'Louvor Domingo',
    functions: ['Vocal'],
  })
  response.assertStatus(201)
  return response.body().id as string
}

async function vocalId(client: ApiClient, ministryId: string) {
  const response = await client.get(`/api/ministerios/${ministryId}/funcoes`)
  response.assertStatus(200)
  return response.body().functions.find((item: { name: string }) => item.name === 'Vocal')
    .id as string
}

async function membershipId(client: ApiClient, ministryId: string, name: string) {
  const response = await client.get(`/api/ministerios/${ministryId}/membros`)
  return response.body().members.find((item: { name: string }) => item.name === name)
    .membershipId as string
}

test.group('Lixeira', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('restaurar a escala devolve a equipe e a música sem mexer na vizinha', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const functionId = await vocalId(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    const song = await client.post(`/api/ministerios/${ministryId}/musicas`).json({
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
    song.assertStatus(201)

    async function publish(title: string) {
      const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
        title,
        startsAt: '2026-10-04T19:00',
        endsAt: null,
        confirmationRequired: false,
      })
      created.assertStatus(201)
      const saved = await client
        .post(`/api/ministerios/${ministryId}/escalas/${created.body().id}/publicar`)
        .json({
          version: 1,
          title,
          startsAt: '2026-10-04T19:00',
          endsAt: null,
          notes: '',
          dressCode: '',
          confirmationRequired: false,
          participants: [{ membershipId: anaId, functionIds: [functionId] }],
          songs: [
            {
              songId: song.body().id,
              versionId: song.body().versions[0].id,
              keyOverride: 'D',
              notes: '',
              highlights: [],
            },
          ],
        })
      saved.assertStatus(200)
      return created.body().id as string
    }

    const removedId = await publish('Culto')
    const neighborId = await publish('Ensaio')
    const removed = await client.delete(`/api/ministerios/${ministryId}/escalas/${removedId}`)
    removed.assertStatus(204)

    const trash = await client.get(`/api/ministerios/${ministryId}/lixeira/escalas`)
    trash.assertStatus(200)
    assert.deepEqual(
      trash.body().schedules.map((item: { title: string }) => item.title),
      ['Culto']
    )

    const restored = await client.post(
      `/api/ministerios/${ministryId}/lixeira/escalas/${removedId}/restaurar`
    )
    restored.assertStatus(200)
    assert.equal(restored.body().participants[0].name, 'Ana')
    assert.equal(restored.body().songs[0].title, 'Grande é o Senhor')

    const neighbor = await client.get(`/api/ministerios/${ministryId}/escalas/${neighborId}`)
    neighbor.assertStatus(200)
    assert.equal(neighbor.body().title, 'Ensaio')
    assert.isNull((await Schedule.findOrFail(neighborId)).deletedAt)
  })

  test('membro comum não restaura e o que passou de 30 dias continua oculto', async ({
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

    const created = await client.post(`/api/ministerios/${ministryId}/musicas`).json({
      title: 'Antiga',
      artist: null,
      bpm: null,
      durationSeconds: null,
      defaultKey: null,
      classificationId: null,
      folderId: null,
      versions: [],
      links: [],
    })
    created.assertStatus(201)
    const songId = created.body().id as string
    const removed = await client.delete(`/api/ministerios/${ministryId}/musicas/${songId}`)
    removed.assertStatus(204)

    const before = await countExpiredTrash()
    const row = await Song.findOrFail(songId)
    row.deletedAt = DateTime.utc().minus({ days: 40 })
    await row.save()

    const hidden = await client.post(
      `/api/ministerios/${ministryId}/lixeira/musicas/${songId}/restaurar`
    )
    hidden.assertStatus(404)
    assert.isNotNull((await Song.findOrFail(songId)).deletedAt)
    assert.equal((await countExpiredTrash()).songs, before.songs + 1)
    assert.isNotNull((await Song.findOrFail(songId)).deletedAt)

    await login(client, 'bia@igreja.com')
    const denied = await client.get(`/api/ministerios/${ministryId}/lixeira/escalas`)
    denied.assertStatus(403)
  })
})

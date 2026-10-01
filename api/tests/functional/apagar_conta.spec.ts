import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'

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

test.group('Apagar conta', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('some o nome do relatório e deixa a outra conta', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministry = await client.post('/api/ministerios').json({
      name: 'Louvor Domingo',
      functions: ['Vocal'],
    })
    const ministryId = ministry.body().id as string
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const functionId = functions.body().functions[0].id as string
    const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
    await register(client, 'Bia', 'bia@igreja.com')
    const entered = await client
      .post('/api/convites/entrar')
      .json({ code: invite.body().invite.code })
    const biaMembershipId = entered.body().membershipId as string
    await login(client, 'ana@igreja.com')
    const approved = await client.post(
      `/api/ministerios/${ministryId}/pedidos/${biaMembershipId}/aprovar`
    )
    approved.assertStatus(204)
    const promoted = await client
      .patch(`/api/ministerios/${ministryId}/membros/${biaMembershipId}`)
      .json({ isAdmin: true })
    promoted.assertStatus(204)

    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members.find((item: { name: string }) => item.name === 'Ana')
      .membershipId as string
    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      confirmationRequired: false,
    })
    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${created.body().id}/publicar`)
      .json({
        version: 1,
        title: 'Culto',
        startsAt: '2026-10-04T19:00',
        endsAt: null,
        notes: '',
        dressCode: '',
        confirmationRequired: false,
        participants: [
          { membershipId: anaId, functionIds: [functionId] },
          { membershipId: biaMembershipId, functionIds: [functionId] },
        ],
        songs: [],
      })
    published.assertStatus(200)

    const wrong = await client.post('/api/perfil/apagar').json({ currentPassword: 'outra-senha' })
    wrong.assertStatus(422)
    const still = await client.get('/api/eu')
    still.assertStatus(200)
    assert.equal(still.body().name, 'Ana')

    const removed = await client.post('/api/perfil/apagar').json({ currentPassword: password })
    removed.assertStatus(204)
    const gone = await client.get('/api/eu')
    gone.assertStatus(204)
    const again = await client.post('/api/entrar').json({ email: 'ana@igreja.com', password })
    again.assertStatus(422)

    const ana = await User.findByOrFail('name', 'membro removido')
    assert.isNotNull(ana.deletedAt)
    assert.notEqual(ana.email, 'ana@igreja.com')

    await login(client, 'bia@igreja.com')
    const report = await client.get(
      `/api/ministerios/${ministryId}/relatorios?from=2026-10-01&to=2026-10-31`
    )
    report.assertStatus(200)
    const names = report.body().members.map((item: { name: string }) => item.name)
    assert.include(names, 'membro removido')
    assert.include(names, 'Bia')
    const me = await client.get('/api/eu')
    assert.equal(me.body().name, 'Bia')
  })
})

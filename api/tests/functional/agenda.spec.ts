import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import CalendarConnection from '#models/calendar_connection'
import User from '#models/user'
import { MemoryCalendarGateway, setCalendarGateway } from '#services/calendar_gateway'

const password = 'senha-segura'
const gateway = new MemoryCalendarGateway()

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

async function connect(client: ApiClient) {
  const response = await client.post('/api/agenda/conectar')
  response.assertStatus(200)
  response.assertBodyContains({ connected: true })
}

function team(members: { membershipId: string; functionIds: string[] }[]) {
  return {
    title: 'Culto',
    endsAt: null,
    notes: '',
    dressCode: '',
    confirmationRequired: false,
    participants: members,
    songs: [],
  }
}

test.group('Agenda', (group) => {
  group.setup(() => {
    setCalendarGateway(gateway)
  })

  group.teardown(() => {
    setCalendarGateway(null)
  })

  group.each.setup(() => {
    gateway.calls = []
    return testUtils.db().withGlobalTransaction()
  })

  test('publicar cria o evento de quem conectou e o horário novo atualiza o mesmo evento', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    const ids = await approve(client, ministryId, ['Bia', 'Caio'])

    await login(client, 'caio@igreja.com')
    await connect(client)
    await login(client, 'ana@igreja.com')
    await connect(client)

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      confirmationRequired: false,
    })
    created.assertStatus(201)
    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${created.body().id}/publicar`)
      .json({
        version: 1,
        startsAt: '2026-10-04T19:00',
        ...team([
          { membershipId: anaId, functionIds: [functions.Vocal] },
          { membershipId: ids.Bia, functionIds: [functions.Vocal] },
        ]),
      })
    published.assertStatus(200)

    const ana = await User.findByOrFail('email', 'ana@igreja.com')
    const connection = await CalendarConnection.findByOrFail('userId', ana.id)
    const creates = gateway.calls.filter((call) => call.op === 'create')
    assert.lengthOf(creates, 1)
    assert.equal(creates[0].op === 'create' && creates[0].calendarId, connection.calendarId)
    assert.equal(creates[0].op === 'create' && creates[0].title, 'Culto')
    const externalId = creates[0].op === 'create' ? creates[0].externalId : ''

    const moved = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${created.body().id}`)
      .json({
        version: published.body().version,
        startsAt: '2026-10-04T21:00',
        ...team([
          { membershipId: anaId, functionIds: [functions.Vocal] },
          { membershipId: ids.Bia, functionIds: [functions.Vocal] },
        ]),
      })
    moved.assertStatus(200)

    const updates = gateway.calls.filter((call) => call.op === 'update')
    assert.lengthOf(updates, 1)
    assert.equal(updates[0].op === 'update' && updates[0].externalId, externalId)
    assert.include(updates[0].op === 'update' ? updates[0].startsAt : '', '21:00')

    const left = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${created.body().id}`)
      .json({
        version: moved.body().version,
        startsAt: '2026-10-04T21:00',
        ...team([{ membershipId: ids.Bia, functionIds: [functions.Vocal] }]),
      })
    left.assertStatus(200)

    const deletions = gateway.calls.filter((call) => call.op === 'delete')
    assert.lengthOf(deletions, 1)
    assert.equal(deletions[0].op === 'delete' && deletions[0].externalId, externalId)
    assert.equal(left.body().participants.length, 1)
    assert.equal(left.body().participants[0].name, 'Bia')
  })

  test('rascunho não cria evento', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    await connect(client)

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      confirmationRequired: false,
    })
    created.assertStatus(201)
    gateway.calls = []

    const saved = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${created.body().id}`)
      .json({
        version: 1,
        startsAt: '2026-10-04T19:00',
        ...team([{ membershipId: anaId, functionIds: [functions.Vocal] }]),
      })
    saved.assertStatus(200)
    assert.equal(saved.body().status, 'draft')
    assert.lengthOf(
      gateway.calls.filter((call) => call.op === 'create'),
      0
    )
  })

  test('desconectar apaga só os eventos futuros', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const functions = await functionIds(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    await connect(client)

    async function publishAt(startsAt: string) {
      const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
        title: 'Culto',
        startsAt,
        endsAt: null,
        confirmationRequired: false,
      })
      created.assertStatus(201)
      const published = await client
        .post(`/api/ministerios/${ministryId}/escalas/${created.body().id}/publicar`)
        .json({
          version: 1,
          startsAt,
          ...team([{ membershipId: anaId, functionIds: [functions.Vocal] }]),
        })
      published.assertStatus(200)
    }

    await publishAt('2026-09-01T19:00')
    await publishAt('2026-10-11T19:00')
    const creates = gateway.calls.filter((call) => call.op === 'create')
    assert.lengthOf(creates, 2)
    const pastId = creates[0].op === 'create' ? creates[0].externalId : ''
    const futureId = creates[1].op === 'create' ? creates[1].externalId : ''

    const disconnected = await client.delete('/api/agenda')
    disconnected.assertStatus(200)
    disconnected.assertBodyContains({ connected: false })

    const deletions = gateway.calls.filter((call) => call.op === 'delete')
    assert.lengthOf(deletions, 1)
    assert.equal(deletions[0].op === 'delete' && deletions[0].externalId, futureId)
    assert.notEqual(pastId, futureId)
  })
})

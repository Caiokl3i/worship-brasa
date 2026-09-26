import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import ChatThread from '#models/chat_thread'

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

async function createSchedule(
  client: ApiClient,
  ministryId: string,
  title: string,
  startsAt: string
) {
  const response = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
    title,
    startsAt,
    endsAt: null,
    notes: '',
    dressCode: '',
  })
  response.assertStatus(201)
  return response.body().id as string
}

test.group('Chat', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('mensagem do culto não vaza para outro culto nem para o chat do ministério', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const first = await createSchedule(client, ministryId, 'Culto A', '2026-10-04T19:00')
    const second = await createSchedule(client, ministryId, 'Culto B', '2026-10-11T19:00')

    const empty = await client.get(`/api/ministerios/${ministryId}/chat`)
    empty.assertStatus(200)
    assert.deepEqual(empty.body().messages, [])
    const threads = await ChatThread.query().where('ministryId', ministryId).whereNull('scheduleId')
    assert.lengthOf(threads, 0)

    const sent = await client
      .post(`/api/ministerios/${ministryId}/escalas/${first}/chat`)
      .json({ body: 'Levar o violão' })
    sent.assertStatus(201)

    const onFirst = await client.get(`/api/ministerios/${ministryId}/escalas/${first}/chat`)
    onFirst.assertStatus(200)
    assert.deepEqual(
      onFirst.body().messages.map((item: { body: string }) => item.body),
      ['Levar o violão']
    )

    const onSecond = await client.get(`/api/ministerios/${ministryId}/escalas/${second}/chat`)
    onSecond.assertStatus(200)
    assert.deepEqual(onSecond.body().messages, [])

    const general = await client.get(`/api/ministerios/${ministryId}/chat`)
    general.assertStatus(200)
    assert.deepEqual(general.body().messages, [])
  })

  test('membro não lê nem escreve no chat do rascunho', async ({ client }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const scheduleId = await createSchedule(client, ministryId, 'Rascunho', '2026-10-04T19:00')
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

    await login(client, 'bia@igreja.com')
    const hidden = await client.get(`/api/ministerios/${ministryId}/escalas/${scheduleId}/chat`)
    hidden.assertStatus(404)
    hidden.assertBodyContains({ message: 'Escala não encontrada.' })

    const denied = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/chat`)
      .json({ body: 'Posso entrar?' })
    denied.assertStatus(404)
    denied.assertBodyContains({ message: 'Escala não encontrada.' })
  })

  test('dois envios juntos ficam os dois', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const [left, right] = await Promise.all([
      client.post(`/api/ministerios/${ministryId}/chat`).json({ body: 'Uma' }),
      client.post(`/api/ministerios/${ministryId}/chat`).json({ body: 'Outra' }),
    ])
    left.assertStatus(201)
    right.assertStatus(201)
    assert.notEqual(left.body().id, right.body().id)

    const listed = await client.get(`/api/ministerios/${ministryId}/chat`)
    listed.assertStatus(200)
    assert.sameMembers(
      listed.body().messages.map((item: { id: string }) => item.id),
      [left.body().id, right.body().id]
    )
  })

  test('a página traz as 50 mais novas e o before traz a anterior', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const blank = await client.post(`/api/ministerios/${ministryId}/chat`).json({ body: '   ' })
    blank.assertStatus(422)
    blank.assertBodyContains({ errors: [{ field: 'body', message: 'Informe a mensagem.' }] })

    for (let index = 1; index <= 51; index += 1) {
      const sent = await client
        .post(`/api/ministerios/${ministryId}/chat`)
        .json({ body: `Mensagem ${index}` })
      sent.assertStatus(201)
    }

    const page = await client.get(`/api/ministerios/${ministryId}/chat`)
    page.assertStatus(200)
    assert.lengthOf(page.body().messages, 50)
    assert.isTrue(page.body().hasMore)
    const bodies = page.body().messages.map((item: { body: string }) => item.body)
    assert.deepEqual(
      bodies,
      bodies.slice().sort((left: string, right: string) => {
        const leftNumber = Number(left.replace('Mensagem ', ''))
        const rightNumber = Number(right.replace('Mensagem ', ''))
        return leftNumber - rightNumber
      })
    )
    assert.equal(bodies.at(-1), 'Mensagem 51')
    assert.notInclude(bodies, 'Mensagem 1')

    const older = await client.get(
      `/api/ministerios/${ministryId}/chat?before=${page.body().messages[0].id}`
    )
    older.assertStatus(200)
    assert.deepEqual(
      older.body().messages.map((item: { body: string }) => item.body),
      ['Mensagem 1']
    )
    assert.isFalse(older.body().hasMore)
  })
})

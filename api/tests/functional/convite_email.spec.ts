import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import { MemoryInviteMailer, setInviteMailer } from '#services/invite_mailer'

const password = 'senha-segura'
const mailer = new MemoryInviteMailer()

async function register(client: ApiClient, name: string, email: string, nextPassword = password) {
  const response = await client.post('/api/cadastrar').json({
    name,
    email,
    password: nextPassword,
    passwordConfirmation: nextPassword,
  })
  response.assertStatus(201)
}

async function login(client: ApiClient, email: string, nextPassword = password) {
  const response = await client.post('/api/entrar').json({ email, password: nextPassword })
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

test.group('Convite por e-mail', (group) => {
  group.setup(() => {
    setInviteMailer(mailer)
  })

  group.teardown(() => {
    setInviteMailer(null)
  })

  group.each.setup(() => {
    mailer.messages = []
    return testUtils.db().withGlobalTransaction()
  })

  test('conta existente recebe o código e não nasce outra conta', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    await register(client, 'Bia', 'bia@igreja.com')
    await login(client, 'ana@igreja.com')

    const before = await User.query().count('* as total')
    const sent = await client
      .post(`/api/ministerios/${ministryId}/convite/email`)
      .json({ email: 'bia@igreja.com' })
    sent.assertStatus(200)
    sent.assertBodyContains({ sent: 'code' })
    assert.notProperty(sent.body(), 'code')

    const after = await User.query().count('* as total')
    assert.equal(after[0].$extras.total, before[0].$extras.total)
    assert.lengthOf(mailer.messages, 1)
    assert.equal(mailer.messages[0].email, 'bia@igreja.com')

    await login(client, 'bia@igreja.com')
    const entered = await client
      .post('/api/convites/entrar')
      .json({ code: mailer.messages[0].code })
    entered.assertStatus(200)
    entered.assertBodyContains({ status: 'pending' })
  })

  test('e-mail novo só vira conta depois da senha, com filiação pendente', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const sent = await client
      .post(`/api/ministerios/${ministryId}/convite/email`)
      .json({ email: 'nova@igreja.com' })
    sent.assertStatus(200)
    sent.assertBodyContains({ sent: 'activation' })
    assert.isNull(await User.findBy('email', 'nova@igreja.com'))

    const wrong = await client.post('/api/ativar/confirmar').json({
      name: 'Nova',
      email: 'nova@igreja.com',
      code: '000000',
      password,
      passwordConfirmation: password,
    })
    wrong.assertStatus(422)
    assert.isNull(await User.findBy('email', 'nova@igreja.com'))

    const confirmed = await client.post('/api/ativar/confirmar').json({
      name: 'Nova',
      email: 'nova@igreja.com',
      code: mailer.messages[0].code,
      password,
      passwordConfirmation: password,
    })
    confirmed.assertStatus(200)

    await login(client, 'nova@igreja.com')
    const list = await client.get('/api/ministerios')
    list.assertStatus(200)
    assert.deepEqual(
      list.body().pending.map((item: { ministryId: string }) => item.ministryId),
      [ministryId]
    )
    assert.lengthOf(list.body().active, 0)

    await login(client, 'ana@igreja.com')
    const requests = await client.get(`/api/ministerios/${ministryId}/pedidos`)
    requests.assertStatus(200)
    assert.equal(requests.body().requests[0].email, 'nova@igreja.com')
  })

  test('se a conta nasce antes da confirmação, a senha dela permanece', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const sent = await client
      .post(`/api/ministerios/${ministryId}/convite/email`)
      .json({ email: 'livre@igreja.com' })
    sent.assertStatus(200)
    const code = mailer.messages[0].code

    await register(client, 'Livre', 'livre@igreja.com')
    await login(client, 'ana@igreja.com')
    const confirmed = await client.post('/api/ativar/confirmar').json({
      name: 'Livre',
      email: 'livre@igreja.com',
      code,
      password: 'senha-outra',
      passwordConfirmation: 'senha-outra',
    })
    confirmed.assertStatus(422)

    await login(client, 'livre@igreja.com')
    const me = await client.get('/api/eu')
    me.assertStatus(200)
    me.assertBodyContains({ name: 'Livre' })
  })
})

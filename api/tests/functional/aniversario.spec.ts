import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import Notification from '#models/notification'
import { notifyBirthdays } from '#services/birthday_service'

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

test.group('Aniversário', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('a início lista o aniversariante e o comando avisa uma vez', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const today = DateTime.now().setZone('America/Sao_Paulo').toFormat('MM-dd')
    const profile = await client.patch('/api/perfil').json({
      name: 'Ana',
      birthDate: `1990-${today}`,
    })
    profile.assertStatus(200)

    const created = await client.post('/api/ministerios').json({
      name: 'Louvor Domingo',
      functions: ['Vocal'],
    })
    created.assertStatus(201)
    const ministryId = created.body().id as string

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

    const home = await client.get(`/api/ministerios/${ministryId}`)
    home.assertStatus(200)
    assert.deepEqual(home.body().birthdays, ['Ana'])
    const again = await client.get(`/api/ministerios/${ministryId}`)
    again.assertStatus(200)
    assert.lengthOf(
      await Notification.query().where('type', 'birthday').where('ministryId', ministryId),
      0
    )

    const preferences = await client.get('/api/notificacoes/preferencias')
    preferences.assertStatus(200)
    const birthday = preferences
      .body()
      .preferences.find((item: { type: string }) => item.type === 'birthday')
    assert.equal(birthday.label, 'Aniversariantes do dia')
    assert.isTrue(birthday.inApp)

    assert.equal(await notifyBirthdays(), 2)
    assert.equal(await notifyBirthdays(), 0)
    const notices = await Notification.query()
      .where('type', 'birthday')
      .where('ministryId', ministryId)
    assert.lengthOf(notices, 2)
    assert.equal(notices[0].body, 'Ana')
  })
})

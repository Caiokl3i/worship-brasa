import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import Notification from '#models/notification'
import { sendDueReminders } from '#services/notification_service'
import {
  setNotificationMailer,
  type NotificationMail,
  type NotificationMailer,
} from '#services/notification_mailer'

const password = 'senha-segura'
const zone = 'America/Sao_Paulo'

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

async function vocalId(client: ApiClient, ministryId: string) {
  const response = await client.get(`/api/ministerios/${ministryId}/funcoes`)
  response.assertStatus(200)
  return response.body().functions[0].id as string
}

async function membershipId(client: ApiClient, ministryId: string, name: string) {
  const response = await client.get(`/api/ministerios/${ministryId}/membros`)
  response.assertStatus(200)
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

function scheduleBody(
  title: string,
  startsAt: string,
  membershipIds: string[],
  functionId: string,
  version = 1
) {
  return {
    version,
    title,
    startsAt,
    endsAt: null,
    notes: '',
    dressCode: '',
    confirmationRequired: true,
    participants: membershipIds.map((id) => ({
      membershipId: id,
      functionIds: [functionId],
    })),
    songs: [],
  }
}

test.group('Notificações', (group) => {
  const sent: NotificationMail[] = []

  group.each.setup(() => {
    sent.length = 0
    const mailer: NotificationMailer = {
      async send(mail) {
        sent.push(mail)
      },
    }
    setNotificationMailer(mailer)
    return testUtils.db().withGlobalTransaction()
  })

  test('publicar com três pessoas avisa as três', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const functionId = await vocalId(client, ministryId)
    const ids = await approve(client, ministryId, ['Bia', 'Caio'])
    const anaId = await membershipId(client, ministryId, 'Ana')

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      confirmationRequired: true,
    })
    created.assertStatus(201)

    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${created.body().id}/publicar`)
      .json(scheduleBody('Culto', '2026-10-04T19:00', [anaId, ids.Bia, ids.Caio], functionId))
    published.assertStatus(200)

    const added = await Notification.query().where('type', 'schedule_added')
    assert.lengthOf(added, 3)
    assert.lengthOf(
      sent.filter((mail) => mail.title === 'Você foi adicionado a uma escala'),
      3
    )
  })

  test('salvar rascunho não avisa', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const functionId = await vocalId(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Ensaio',
      startsAt: '2026-10-05T19:00',
      endsAt: null,
      confirmationRequired: false,
    })
    created.assertStatus(201)

    const saved = await client
      .patch(`/api/ministerios/${ministryId}/escalas/${created.body().id}`)
      .json(scheduleBody('Ensaio', '2026-10-05T19:00', [anaId], functionId))
    saved.assertStatus(200)
    assert.equal(saved.body().status, 'draft')

    const added = await Notification.query().where('type', 'schedule_added')
    assert.lengthOf(added, 0)
    assert.lengthOf(
      sent.filter((mail) => mail.title === 'Você foi adicionado a uma escala'),
      0
    )
  })

  test('desligar o e-mail mantém o aviso interno', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const functionId = await vocalId(client, ministryId)
    const anaId = await membershipId(client, ministryId, 'Ana')
    const preferences = await client.put('/api/notificacoes/preferencias').json({
      preferences: [{ type: 'schedule_added', inApp: true, email: false }],
    })
    preferences.assertStatus(200)

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto',
      startsAt: '2026-10-04T19:00',
      endsAt: null,
      confirmationRequired: true,
    })
    created.assertStatus(201)
    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${created.body().id}/publicar`)
      .json(scheduleBody('Culto', '2026-10-04T19:00', [anaId], functionId))
    published.assertStatus(200)

    const added = await Notification.query().where('type', 'schedule_added')
    assert.lengthOf(added, 1)
    assert.lengthOf(
      sent.filter((mail) => mail.title === 'Você foi adicionado a uma escala'),
      0
    )
  })

  test('lembrete de um dia sai uma vez, no horário do ministério, e quem recusou fica de fora', async ({
    client,
    assert,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const functionId = await vocalId(client, ministryId)
    const ids = await approve(client, ministryId, ['Bia'])
    const anaId = await membershipId(client, ministryId, 'Ana')
    const ana = await client.get('/api/eu')
    const anaUserId = ana.body().id as string

    const created = await client.post(`/api/ministerios/${ministryId}/escalas`).json({
      title: 'Culto de domingo',
      startsAt: '2026-09-27T18:00',
      endsAt: '2026-09-27T20:00',
      confirmationRequired: true,
    })
    created.assertStatus(201)
    const scheduleId = created.body().id as string
    const published = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/publicar`)
      .json({
        ...scheduleBody('Culto de domingo', '2026-09-27T18:00', [anaId, ids.Bia], functionId),
        endsAt: '2026-09-27T20:00',
      })
    published.assertStatus(200)

    await login(client, 'bia@igreja.com')
    const declined = await client
      .post(`/api/ministerios/${ministryId}/escalas/${scheduleId}/confirmacao`)
      .json({ confirmation: 'declined' })
    declined.assertStatus(200)
    const bia = await client.get('/api/eu')
    const biaUserId = bia.body().id as string

    const utcMidnight = DateTime.fromISO('2026-09-26T00:00:00.000Z')
    await sendDueReminders(utcMidnight)
    assert.lengthOf(await Notification.query().where('type', 'reminder_1d'), 0)

    const saturdayEvening = DateTime.fromISO('2026-09-26T18:00', { zone })
    await sendDueReminders(saturdayEvening)
    await sendDueReminders(saturdayEvening)

    const reminders = await Notification.query().where('type', 'reminder_1d')
    assert.lengthOf(reminders, 1)
    assert.equal(reminders[0].userId, anaUserId)
    assert.notEqual(reminders[0].userId, biaUserId)
    assert.equal(reminders[0].body, '1 dia antes')
    assert.lengthOf(
      sent.filter((mail) => mail.body === '1 dia antes'),
      1
    )
  })

  test('aviso novo não cria notificação com o padrão desligado', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const created = await client.post(`/api/ministerios/${ministryId}/avisos`).json({
      title: 'Ensaio cancelado',
      body: 'Sem ensaio hoje.',
      pinned: false,
      expiresAt: null,
    })
    created.assertStatus(201)
    assert.lengthOf(await Notification.query().where('type', 'notice'), 0)
  })
})

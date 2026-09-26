import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import { archiveExpiredNotices } from '#services/notice_service'

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

function localDate(daysFromToday: number) {
  return DateTime.now().setZone(zone).plus({ days: daysFromToday }).toISODate()
}

test.group('Avisos', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('membro vê o destaque, não cria, e arquivar tira da início', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string

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

    const blank = await client.post(`/api/ministerios/${ministryId}/avisos`).json({
      title: '',
      body: '',
      pinned: true,
    })
    blank.assertStatus(422)
    assert.include(
      blank.body().errors.map((item: { field: string }) => item.field),
      'title'
    )

    const created = []
    for (const title of ['Primeiro', 'Segundo', 'Terceiro', 'Quarto']) {
      const response = await client.post(`/api/ministerios/${ministryId}/avisos`).json({
        title,
        body: `Texto de ${title}`,
        pinned: true,
        expiresAt: null,
      })
      response.assertStatus(201)
      created.push(response.body())
    }

    const listed = await client.get(`/api/ministerios/${ministryId}/avisos`)
    listed.assertStatus(200)
    assert.deepEqual(
      listed.body().pinned.map((item: { title: string }) => item.title),
      ['Quarto', 'Terceiro', 'Segundo']
    )
    assert.notInclude(
      listed.body().pinned.map((item: { title: string }) => item.title),
      'Primeiro'
    )

    const edited = await client
      .patch(`/api/ministerios/${ministryId}/avisos/${created[3].id}`)
      .json({
        title: 'Quarto revisado',
        body: 'Texto de Quarto',
        pinned: true,
        expiresAt: null,
      })
    edited.assertStatus(200)
    assert.equal(edited.body().author.membershipId, anaId)
    assert.equal(edited.body().author.name, 'Ana')

    await login(client, 'bia@igreja.com')
    const seen = await client.get(`/api/ministerios/${ministryId}/avisos`)
    seen.assertStatus(200)
    assert.include(
      seen.body().pinned.map((item: { title: string }) => item.title),
      'Quarto revisado'
    )
    assert.deepEqual(seen.body().archived, [])

    const denied = await client.post(`/api/ministerios/${ministryId}/avisos`).json({
      title: 'Do membro',
      body: 'Não pode',
      pinned: false,
    })
    denied.assertStatus(403)
    denied.assertBodyContains({ message: 'Você não pode fazer isso.' })

    await login(client, 'ana@igreja.com')
    const archived = await client.post(
      `/api/ministerios/${ministryId}/avisos/${created[3].id}/arquivar`
    )
    archived.assertStatus(200)
    assert.isNotNull(archived.body().archivedAt)

    const after = await client.get(`/api/ministerios/${ministryId}/avisos`)
    after.assertStatus(200)
    assert.notInclude(
      after.body().notices.map((item: { title: string }) => item.title),
      'Quarto revisado'
    )
    assert.notInclude(
      after.body().pinned.map((item: { title: string }) => item.title),
      'Quarto revisado'
    )
    assert.include(
      after.body().archived.map((item: { title: string }) => item.title),
      'Quarto revisado'
    )

    const restored = await client.post(
      `/api/ministerios/${ministryId}/avisos/${created[3].id}/desarquivar`
    )
    restored.assertStatus(200)
    const back = await client.get(`/api/ministerios/${ministryId}/avisos`)
    assert.include(
      back.body().notices.map((item: { title: string }) => item.title),
      'Quarto revisado'
    )
  })

  test('o vencimento vale até o dia marcado, no fuso do ministério', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client)
    const today = await client.post(`/api/ministerios/${ministryId}/avisos`).json({
      title: 'Hoje',
      body: 'Ainda vale',
      pinned: true,
      expiresAt: localDate(0),
    })
    today.assertStatus(201)
    const yesterday = await client.post(`/api/ministerios/${ministryId}/avisos`).json({
      title: 'Ontem',
      body: 'Já passou',
      pinned: true,
      expiresAt: localDate(-1),
    })
    yesterday.assertStatus(201)

    const listed = await client.get(`/api/ministerios/${ministryId}/avisos`)
    listed.assertStatus(200)
    const current = listed.body().notices.map((item: { title: string }) => item.title)
    assert.include(current, 'Hoje')
    assert.notInclude(current, 'Ontem')
    assert.include(
      listed.body().pinned.map((item: { title: string }) => item.title),
      'Hoje'
    )
    const expired = listed.body().archived.find((item: { title: string }) => item.title === 'Ontem')
    assert.equal(expired.archivedAt, null)

    const count = await archiveExpiredNotices()
    assert.equal(count, 1)
    const filled = await client.get(`/api/ministerios/${ministryId}/avisos`)
    const stored = filled.body().archived.find((item: { title: string }) => item.title === 'Ontem')
    assert.isNotNull(stored.archivedAt)
    assert.notInclude(
      filled.body().notices.map((item: { title: string }) => item.title),
      'Ontem'
    )
  })
})

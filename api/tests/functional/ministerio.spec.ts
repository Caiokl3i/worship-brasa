import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import Invite from '#models/invite'

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

async function createMinistry(client: ApiClient, name: string, functions = ['Vocal', 'Violão']) {
  const response = await client.post('/api/ministerios').json({ name, functions })
  response.assertStatus(201)
  return response.body().id as string
}

test.group('Ministério', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('quem cria é administrador e a outra conta só aparece depois da aprovação', async ({
    client,
  }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')

    const mine = await client.get(`/api/ministerios/${ministryId}`)
    mine.assertStatus(200)
    mine.assertBodyContains({
      name: 'Louvor Ágape',
      membership: { isAdmin: true, canManageFunctions: true },
    })

    const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
    invite.assertStatus(201)
    const code = invite.body().invite.code as string

    await register(client, 'Bia', 'bia@igreja.com')
    const entered = await client.post('/api/convites/entrar').json({ code })
    entered.assertStatus(200)
    entered.assertBodyContains({ ministryName: 'Louvor Ágape', status: 'pending' })

    const before = await client.get(`/api/ministerios/${ministryId}/membros`)
    before.assertStatus(404)

    await login(client, 'ana@igreja.com')
    const queue = await client.get(`/api/ministerios/${ministryId}/pedidos`)
    queue.assertStatus(200)
    const membershipId = queue.body().requests[0].membershipId as string

    const approved = await client.post(
      `/api/ministerios/${ministryId}/pedidos/${membershipId}/aprovar`
    )
    approved.assertStatus(204)

    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    members.assertStatus(200)
    members.assertBodyContains({ members: [{ name: 'Bia', isAdmin: false }] })
  })

  test('membro comum não aprova nem altera permissão', async ({ client }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
    const code = invite.body().invite.code as string

    await register(client, 'Bia', 'bia@igreja.com')
    await client.post('/api/convites/entrar').json({ code })

    await login(client, 'ana@igreja.com')
    const queue = await client.get(`/api/ministerios/${ministryId}/pedidos`)
    const biaId = queue.body().requests[0].membershipId as string
    await client.post(`/api/ministerios/${ministryId}/pedidos/${biaId}/aprovar`)

    await register(client, 'Caio', 'caio@igreja.com')
    await client.post('/api/convites/entrar').json({ code })

    await login(client, 'bia@igreja.com')
    const hidden = await client.get(`/api/ministerios/${ministryId}/pedidos`)
    hidden.assertStatus(403)
    hidden.assertBodyContains({ message: 'Você não pode fazer isso.' })

    const pending = await client.get(`/api/ministerios/${ministryId}/pedidos`)
    await login(client, 'ana@igreja.com')
    const again = await client.get(`/api/ministerios/${ministryId}/pedidos`)
    const caioId = again.body().requests[0].membershipId as string

    await login(client, 'bia@igreja.com')
    const denied = await client.post(`/api/ministerios/${ministryId}/pedidos/${caioId}/aprovar`)
    denied.assertStatus(403)

    const flags = await client
      .patch(`/api/ministerios/${ministryId}/membros/${biaId}`)
      .json({ canManageFunctions: true })
    flags.assertStatus(403)
    assertUnused(pending)
  })

  test('o último administrador não sai nem é rebaixado', async ({ client }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string

    const left = await client.post(`/api/ministerios/${ministryId}/sair`)
    left.assertStatus(422)
    left.assertBodyContains({
      errors: [{ field: 'isAdmin', message: 'O ministério precisa de um administrador.' }],
    })

    const demoted = await client
      .patch(`/api/ministerios/${ministryId}/membros/${anaId}`)
      .json({ isAdmin: false })
    demoted.assertStatus(422)
    demoted.assertBodyContains({
      errors: [{ message: 'O ministério precisa de um administrador.' }],
    })

    const still = await client.get(`/api/ministerios/${ministryId}`)
    still.assertStatus(200)
    still.assertBodyContains({ membership: { isAdmin: true } })
  })

  test('código revogado não entra e o novo serve uma vez só', async ({ client }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const first = await client.post(`/api/ministerios/${ministryId}/convite`)
    const oldCode = first.body().invite.code as string
    const second = await client.post(`/api/ministerios/${ministryId}/convite`)
    const newCode = second.body().invite.code as string

    await register(client, 'Bia', 'bia@igreja.com')
    const revoked = await client.post('/api/convites/entrar').json({ code: oldCode })
    revoked.assertStatus(422)
    revoked.assertBodyContains({
      errors: [{ field: 'code', message: 'Código inválido ou vencido.' }],
    })

    const entered = await client.post('/api/convites/entrar').json({ code: newCode })
    entered.assertStatus(200)

    const again = await client.post('/api/convites/entrar').json({ code: newCode })
    again.assertStatus(200)
    again.assertBodyContains({ membershipId: entered.body().membershipId })
  })

  test('código vencido não entra', async ({ client }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape')
    const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
    const code = invite.body().invite.code as string

    const row = await Invite.findByOrFail('code', code)
    row.expiresAt = DateTime.utc().minus({ minutes: 1 })
    await row.save()

    await register(client, 'Bia', 'bia@igreja.com')
    const expired = await client.post('/api/convites/entrar').json({ code })
    expired.assertStatus(422)
  })

  test('usuário de um ministério não lê membros de outro', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryA = await createMinistry(client, 'Louvor Ágape')

    await register(client, 'Bia', 'bia@igreja.com')
    const ministryB = await createMinistry(client, 'Recepção')

    const leaked = await client.get(`/api/ministerios/${ministryA}/membros`)
    leaked.assertStatus(404)
    leaked.assertBodyContains({ message: 'Ministério não encontrado.' })
    assert.notInclude(JSON.stringify(leaked.body()), 'Louvor Ágape')
    assert.notInclude(JSON.stringify(leaked.body()), 'Ana')

    const own = await client.get(`/api/ministerios/${ministryB}/membros`)
    own.assertStatus(200)
    own.assertBodyContains({ members: [{ name: 'Bia' }] })
  })

  test('arquivar impede atribuição nova e mantém o nome em quem já tinha', async ({ client }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    const ministryId = await createMinistry(client, 'Louvor Ágape', ['Vocal'])
    const functions = await client.get(`/api/ministerios/${ministryId}/funcoes`)
    const vocalId = functions.body().functions[0].id as string
    const members = await client.get(`/api/ministerios/${ministryId}/membros`)
    const anaId = members.body().members[0].membershipId as string

    const assigned = await client
      .put(`/api/ministerios/${ministryId}/membros/${anaId}/funcoes`)
      .json({ functionIds: [vocalId] })
    assigned.assertStatus(204)

    const archived = await client.post(`/api/ministerios/${ministryId}/funcoes/${vocalId}/arquivar`)
    archived.assertStatus(200)
    archived.assertBodyContains({ archived: true, name: 'Vocal' })

    const invite = await client.post(`/api/ministerios/${ministryId}/convite`)
    const code = invite.body().invite.code as string
    await register(client, 'Bia', 'bia@igreja.com')
    await client.post('/api/convites/entrar').json({ code })
    await login(client, 'ana@igreja.com')
    const queue = await client.get(`/api/ministerios/${ministryId}/pedidos`)
    const biaId = queue.body().requests[0].membershipId as string
    await client.post(`/api/ministerios/${ministryId}/pedidos/${biaId}/aprovar`)

    const blocked = await client
      .put(`/api/ministerios/${ministryId}/membros/${biaId}/funcoes`)
      .json({ functionIds: [vocalId] })
    blocked.assertStatus(422)

    const kept = await client.get(`/api/ministerios/${ministryId}/membros`)
    kept.assertBodyContains({
      members: [{ name: 'Ana', functions: [{ name: 'Vocal', archived: true }] }],
    })
  })
})

function assertUnused(response: { assertStatus: (status: number) => void }) {
  response.assertStatus(403)
}

import { test } from '@japa/runner'
import type { ApiClient } from '@japa/api-client'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import { MemoryGoogleIdentities, setGoogleIdentityVerifier } from '#services/google_identity'

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

async function start(client: ApiClient) {
  const response = await client.post('/api/entrar/google')
  response.assertStatus(200)
  const state = new URL(response.body().url as string).searchParams.get('state')
  return state ?? ''
}

test.group('Entrar com Google', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => {
    setGoogleIdentityVerifier(null)
  })

  test('sem credencial o botão avisa que o Google não está configurado', async ({ client }) => {
    const response = await client.post('/api/entrar/google')
    response.assertStatus(422)
    response.assertBodyContains({
      errors: [{ field: 'google', message: 'O Google não está configurado.' }],
    })
  })

  test('entra só com e-mail verificado de uma conta que já existe', async ({ client, assert }) => {
    await register(client, 'Ana', 'ana@igreja.com')
    await client.post('/api/sair')
    const before = (await User.all()).length

    setGoogleIdentityVerifier(
      new MemoryGoogleIdentities([
        { code: 'ok', email: 'ana@igreja.com', emailVerified: true },
        { code: 'novo', email: 'novo@igreja.com', emailVerified: true },
        { code: 'aberto', email: 'ana@igreja.com', emailVerified: false },
      ])
    )

    const known = await client
      .get(`/api/entrar/google/retorno?code=ok&state=${await start(client)}`)
      .redirects(0)
    known.assertStatus(302)
    const me = await client.get('/api/eu')
    me.assertStatus(200)
    assert.equal(me.body().email, 'ana@igreja.com')
    await client.post('/api/sair')

    const unknown = await client
      .get(`/api/entrar/google/retorno?code=novo&state=${await start(client)}`)
      .redirects(0)
    unknown.assertStatus(302)
    assert.include(unknown.header('location'), 'google=desconhecido')
    const stillOut = await client.get('/api/eu')
    stillOut.assertStatus(401)

    const unverified = await client
      .get(`/api/entrar/google/retorno?code=aberto&state=${await start(client)}`)
      .redirects(0)
    unverified.assertStatus(302)
    assert.include(unverified.header('location'), 'google=desconhecido')
    const stillOutAgain = await client.get('/api/eu')
    stillOutAgain.assertStatus(401)
    assert.equal((await User.all()).length, before)
  })
})

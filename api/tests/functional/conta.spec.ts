import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import PasswordReset from '#models/password_reset'
import { setPasswordResetMailer, type PasswordResetMailer } from '#services/password_reset_mailer'

const password = 'senha-segura'

test.group('Conta', (group) => {
  const codes: string[] = []

  group.each.setup(async () => {
    codes.length = 0
    const mailer: PasswordResetMailer = {
      async sendCode(_email, code) {
        codes.push(code)
      },
    }
    setPasswordResetMailer(mailer)
    return testUtils.db().withGlobalTransaction()
  })

  test('cadastra e entra com o cookie', async ({ client, assert }) => {
    const created = await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ANA@igreja.com',
      password,
      passwordConfirmation: password,
    })

    created.assertStatus(201)
    assert.equal(created.body().email, 'ana@igreja.com')
    assert.notProperty(created.body(), 'password')
    assert.notInclude(JSON.stringify(created.body()), password)

    const me = await client.get('/api/eu')
    me.assertStatus(200)
    me.assertBodyContains({ name: 'Ana', email: 'ana@igreja.com' })
  })

  test('não cria duas contas com o mesmo e-mail', async ({ client }) => {
    const body = {
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    }

    await client.post('/api/cadastrar').json(body)
    const again = await client.post('/api/cadastrar').json(body)

    again.assertStatus(422)
    again.assertBodyContains({
      errors: [{ field: 'email', message: 'Este e-mail já está em uso.' }],
    })
  })

  test('senha errada não diz qual campo falhou', async ({ client }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    const login = await client.post('/api/entrar').json({
      email: 'ana@igreja.com',
      password: 'outra-senha',
    })

    login.assertStatus(422)
    login.assertBodyContains({
      errors: [{ field: 'email', message: 'E-mail ou senha inválidos.' }],
    })
  })

  test('rota interna sem cookie responde 401', async ({ client }) => {
    const me = await client.get('/api/eu')
    me.assertStatus(401)
  })

  test('troca a senha e mantém esta sessão', async ({ client }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    const changed = await client.post('/api/perfil/senha').json({
      currentPassword: password,
      password: 'senha-nova-8',
      passwordConfirmation: 'senha-nova-8',
    })

    changed.assertStatus(200)

    const me = await client.get('/api/eu')
    me.assertStatus(200)
  })

  test('sessão com versão velha cai', async ({ client }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    const userModule = await import('#models/user')
    const User = userModule.default
    const user = await User.findByOrFail('email', 'ana@igreja.com')
    user.authVersion += 1
    await user.save()

    const me = await client.get('/api/eu')
    me.assertStatus(401)
  })

  test('código novo funciona uma vez e não volta no json', async ({ client, assert }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    const asked = await client.post('/api/recuperar-senha').json({
      email: 'ana@igreja.com',
    })

    asked.assertStatus(200)
    asked.assertBodyContains({
      message: 'Se o e-mail existir, enviamos o código.',
    })
    assert.notInclude(JSON.stringify(asked.body()), codes[0])
    assert.lengthOf(codes, 1)

    const confirmed = await client.post('/api/recuperar-senha/confirmar').json({
      email: 'ana@igreja.com',
      code: codes[0],
      password: 'senha-nova-8',
      passwordConfirmation: 'senha-nova-8',
    })

    confirmed.assertStatus(200)

    const again = await client.post('/api/recuperar-senha/confirmar').json({
      email: 'ana@igreja.com',
      code: codes[0],
      password: 'senha-nova-9',
      passwordConfirmation: 'senha-nova-9',
    })

    again.assertStatus(422)
  })

  test('código vencido não troca a senha', async ({ client }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    await client.post('/api/recuperar-senha').json({ email: 'ana@igreja.com' })

    const reset = await PasswordReset.query().firstOrFail()
    reset.expiresAt = DateTime.utc().minus({ minutes: 1 })
    await reset.save()

    const confirmed = await client.post('/api/recuperar-senha/confirmar').json({
      email: 'ana@igreja.com',
      code: codes[0],
      password: 'senha-nova-8',
      passwordConfirmation: 'senha-nova-8',
    })

    confirmed.assertStatus(422)
  })

  test('salva o perfil com a data de nascimento', async ({ client, assert }) => {
    await client.post('/api/cadastrar').json({
      name: 'Ana',
      email: 'ana@igreja.com',
      password,
      passwordConfirmation: password,
    })

    const updated = await client.patch('/api/perfil').json({
      name: 'Ana Clara',
      birthDate: '1990-05-12',
    })

    updated.assertStatus(200)
    updated.assertBodyContains({
      name: 'Ana Clara',
      email: 'ana@igreja.com',
      birthDate: '1990-05-12',
    })
    assert.notProperty(updated.body(), 'password')
  })

  test('e-mail desconhecido recebe a mesma frase e nenhum código', async ({ client, assert }) => {
    const asked = await client.post('/api/recuperar-senha').json({
      email: 'ninguem@igreja.com',
    })

    asked.assertStatus(200)
    asked.assertBodyContains({
      message: 'Se o e-mail existir, enviamos o código.',
    })
    assert.lengthOf(codes, 0)
  })
})

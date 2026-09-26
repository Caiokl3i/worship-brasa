import { randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import AccountService from '#services/account_service'
import {
  getGoogleIdentityVerifier,
  googleLoginConfigured,
  googleLoginErrorUrl,
  googleLoginUrl,
} from '#services/google_identity'
import { webOrigin } from '#services/calendar_google'
import { loginValidator } from '#validators/user'
import { toPublicUser } from '#users/public_user'

const invalidLogin = {
  errors: [{ field: 'email', message: 'E-mail ou senha inválidos.' }],
}

export default class SessionController {
  async store({ request, response, auth, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)
    const user = await new AccountService().authenticate(email, password)

    if (!user) {
      return response.unprocessableEntity(invalidLogin)
    }

    await auth.use('web').login(user)
    session.put('auth_version', user.authVersion)

    return response.ok(await toPublicUser(user))
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.noContent()
  }

  async google({ response, session }: HttpContext) {
    if (!googleLoginConfigured()) {
      return response.unprocessableEntity({
        errors: [{ field: 'google', message: 'O Google não está configurado.' }],
      })
    }

    const state = randomBytes(16).toString('hex')
    session.put('google_login_state', state)
    return response.ok({ url: googleLoginUrl(state) })
  }

  async googleCallback({ request, response, auth, session }: HttpContext) {
    const state = request.input('state')
    const code = request.input('code')
    const expected = session.get('google_login_state')
    session.forget('google_login_state')

    if (!state || state !== expected || !code) {
      return response.redirect(googleLoginErrorUrl())
    }

    const identity = await getGoogleIdentityVerifier().exchange(String(code))
    if (!identity?.emailVerified) {
      return response.redirect(googleLoginErrorUrl())
    }

    const user = await User.query()
      .whereRaw('lower(email) = ?', [identity.email.toLowerCase()])
      .first()
    if (!user || user.deletedAt) {
      return response.redirect(googleLoginErrorUrl())
    }

    await auth.use('web').login(user)
    session.put('auth_version', user.authVersion)
    return response.redirect(`${webOrigin()}/ministerios`)
  }
}

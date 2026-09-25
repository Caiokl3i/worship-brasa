import type { HttpContext } from '@adonisjs/core/http'
import AccountService from '#services/account_service'
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

    return response.ok(toPublicUser(user))
  }

  async destroy({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.noContent()
  }
}

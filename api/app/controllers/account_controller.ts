import type { HttpContext } from '@adonisjs/core/http'
import AccountService from '#services/account_service'
import { registerValidator } from '#validators/user'
import { toPublicUser } from '#users/public_user'

export default class AccountController {
  async store({ request, response, auth, session }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const user = await new AccountService().register({
      name: payload.name,
      email: payload.email,
      password: payload.password,
    })

    await auth.use('web').login(user)
    session.put('auth_version', user.authVersion)

    return response.created(toPublicUser(user))
  }
}

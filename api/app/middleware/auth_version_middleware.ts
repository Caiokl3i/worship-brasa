import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AuthVersionMiddleware {
  async handle({ auth, session, response }: HttpContext, next: NextFn) {
    const user = auth.getUserOrFail()
    const version = Number(session.get('auth_version'))

    if (version !== user.authVersion) {
      await auth.use('web').logout()
      return response.unauthorized({ message: 'Sessão encerrada. Entre de novo.' })
    }

    return next()
  }
}

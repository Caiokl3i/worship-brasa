import type { HttpContext } from '@adonisjs/core/http'
import PasswordResetService from '#services/password_reset_service'
import { confirmResetValidator, requestResetValidator } from '#validators/user'

const sent = {
  message: 'Se o e-mail existir, enviamos o código.',
}

const rejected = {
  errors: [{ field: 'code', message: 'Código inválido ou vencido.' }],
}

export default class PasswordResetController {
  async store({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(requestResetValidator)
    await new PasswordResetService().requestCode(email)
    return response.ok(sent)
  }

  async update({ request, response }: HttpContext) {
    const payload = await request.validateUsing(confirmResetValidator)
    const ok = await new PasswordResetService().confirmCode(
      payload.email,
      payload.code,
      payload.password
    )

    if (!ok) {
      return response.unprocessableEntity(rejected)
    }

    return response.ok({ message: 'Senha atualizada. Entre com a senha nova.' })
  }
}

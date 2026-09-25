import type { HttpContext } from '@adonisjs/core/http'
import AccountService from '#services/account_service'
import { changePasswordValidator, updateProfileValidator } from '#validators/user'
import { toPublicUser } from '#users/public_user'

const wrongCurrentPassword = {
  errors: [{ field: 'currentPassword', message: 'A senha atual não confere.' }],
}

export default class ProfileController {
  async show({ auth, response }: HttpContext) {
    return response.ok(toPublicUser(auth.getUserOrFail()))
  }

  async update({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateProfileValidator)
    const user = auth.getUserOrFail()

    await new AccountService().updateProfile(user, {
      name: payload.name,
      birthDate: payload.birthDate ?? null,
    })

    return response.ok(toPublicUser(user))
  }

  async updatePassword({ auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(changePasswordValidator)
    const user = auth.getUserOrFail()
    const ok = await new AccountService().changePassword(
      user,
      payload.currentPassword,
      payload.password
    )

    if (!ok) {
      return response.unprocessableEntity(wrongCurrentPassword)
    }

    session.put('auth_version', user.authVersion)
    return response.ok(toPublicUser(user))
  }
}

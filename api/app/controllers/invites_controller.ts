import type { HttpContext } from '@adonisjs/core/http'
import InviteService from '#services/invite_service'
import InviteEmailService from '#services/invite_email_service'
import { enterInviteValidator } from '#validators/ministry'
import { activateInviteValidator, sendInviteEmailValidator } from '#validators/invite_email'
import { toInvite } from '#ministries/public_ministry'

const rejected = {
  errors: [{ field: 'code', message: 'Código inválido ou vencido.' }],
}

export default class InvitesController {
  async show({ membership, response }: HttpContext) {
    const invite = await new InviteService().current(membership)
    return response.ok({ invite: invite ? toInvite(invite) : null })
  }

  async store({ membership, response }: HttpContext) {
    const invite = await new InviteService().generate(membership)
    return response.created({ invite: toInvite(invite) })
  }

  async enter({ auth, request, response }: HttpContext) {
    const { code } = await request.validateUsing(enterInviteValidator)
    const result = await new InviteService().enter(auth.getUserOrFail().id, code)

    return response.ok({
      membershipId: result.membership.id,
      ministryId: result.membership.ministryId,
      ministryName: result.ministryName,
      status: 'pending' as const,
    })
  }

  async email({ membership, request, response }: HttpContext) {
    const { email } = await request.validateUsing(sendInviteEmailValidator)
    const result = await new InviteEmailService().send(membership, email)
    return response.ok(result)
  }

  async activate({ request, response }: HttpContext) {
    const payload = await request.validateUsing(activateInviteValidator)
    const ok = await new InviteEmailService().activate(
      payload.email,
      payload.code,
      payload.name,
      payload.password
    )
    if (!ok) {
      return response.unprocessableEntity(rejected)
    }
    return response.ok({ message: 'Conta criada. Entre com a senha nova.' })
  }
}

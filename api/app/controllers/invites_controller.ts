import type { HttpContext } from '@adonisjs/core/http'
import InviteService from '#services/invite_service'
import { enterInviteValidator } from '#validators/ministry'
import { toInvite } from '#ministries/public_ministry'

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
}

import type { HttpContext } from '@adonisjs/core/http'
import MemberService from '#services/member_service'
import { assignFunctionsValidator, updateMemberValidator } from '#validators/ministry'
import { toMember } from '#ministries/public_ministry'

export default class MembersController {
  async index({ membership, request, response }: HttpContext) {
    const term = String(request.input('q', '')).trim().slice(0, 120)
    const members = await new MemberService().list(membership, term)

    return response.ok({
      members: members.map((member) => toMember(member, membership.isAdmin)),
    })
  }

  async pending({ membership, response }: HttpContext) {
    const requests = await new MemberService().pending(membership)

    return response.ok({
      requests: requests.map((row) => ({
        membershipId: row.id,
        name: row.user.name,
        email: row.user.email,
      })),
    })
  }

  async approve({ membership, params, response }: HttpContext) {
    await new MemberService().approve(membership, params.membershipId)
    return response.noContent()
  }

  async reject({ membership, params, response }: HttpContext) {
    await new MemberService().reject(membership, params.membershipId)
    return response.noContent()
  }

  async cancel({ auth, params, response }: HttpContext) {
    await new MemberService().cancel(auth.getUserOrFail().id, params.membershipId)
    return response.noContent()
  }

  async update({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateMemberValidator)
    await new MemberService().updateAccess(membership, params.membershipId, payload)
    return response.noContent()
  }

  async assignFunctions({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(assignFunctionsValidator)
    await new MemberService().assignFunctions(membership, params.membershipId, payload.functionIds)
    return response.noContent()
  }
}

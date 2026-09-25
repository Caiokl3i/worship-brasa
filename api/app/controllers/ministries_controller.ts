import type { HttpContext } from '@adonisjs/core/http'
import MinistryService from '#services/ministry_service'
import { createMinistryValidator, updateMinistryValidator } from '#validators/ministry'
import { toMembershipAccess, toPublicMinistry } from '#ministries/public_ministry'

export default class MinistriesController {
  async index({ auth, response }: HttpContext) {
    const rows = await new MinistryService().listFor(auth.getUserOrFail().id)

    return response.ok({
      active: rows
        .filter((row) => row.status === 'active')
        .map((row) => ({
          ...toPublicMinistry(row.ministry),
          membershipId: row.id,
        })),
      pending: rows
        .filter((row) => row.status === 'pending')
        .map((row) => ({
          membershipId: row.id,
          ministryId: row.ministryId,
          ministryName: row.ministry.name,
        })),
    })
  }

  async store({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(createMinistryValidator)
    const ministry = await new MinistryService().create(auth.getUserOrFail().id, payload)
    return response.created(toPublicMinistry(ministry))
  }

  async show({ membership, response }: HttpContext) {
    const ministry = await new MinistryService().show(membership)
    return response.ok({
      ...toPublicMinistry(ministry),
      membership: toMembershipAccess(membership),
    })
  }

  async update({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(updateMinistryValidator)
    const ministry = await new MinistryService().update(membership, payload)
    return response.ok({
      ...toPublicMinistry(ministry),
      membership: toMembershipAccess(membership),
    })
  }

  async leave({ membership, response }: HttpContext) {
    await new MinistryService().leave(membership)
    return response.noContent()
  }
}

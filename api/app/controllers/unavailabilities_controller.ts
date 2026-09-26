import type { HttpContext } from '@adonisjs/core/http'
import UnavailabilityService from '#services/unavailability_service'
import { saveUnavailabilityValidator } from '#validators/schedule'

export default class UnavailabilitiesController {
  async index({ membership, response }: HttpContext) {
    const unavailabilities = await new UnavailabilityService().list(membership)
    return response.ok({ unavailabilities })
  }

  async store({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveUnavailabilityValidator)
    const unavailability = await new UnavailabilityService().create(membership, payload)
    return response.created(unavailability)
  }

  async update({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveUnavailabilityValidator)
    const unavailability = await new UnavailabilityService().update(
      membership,
      params.unavailabilityId,
      payload
    )
    return response.ok(unavailability)
  }

  async destroy({ membership, params, response }: HttpContext) {
    await new UnavailabilityService().delete(membership, params.unavailabilityId)
    return response.noContent()
  }
}

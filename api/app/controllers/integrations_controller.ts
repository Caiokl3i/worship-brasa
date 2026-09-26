import type { HttpContext } from '@adonisjs/core/http'
import IntegrationService from '#services/integration_service'
import { integrationRangeValidator } from '#validators/integration'

export default class IntegrationsController {
  async store({ membership, response }: HttpContext) {
    const created = await new IntegrationService().create(membership)
    return response.created(created)
  }

  async current({ membership, response }: HttpContext) {
    const token = await new IntegrationService().current(membership)
    return response.ok({ token })
  }

  async destroy({ membership, response }: HttpContext) {
    await new IntegrationService().revoke(membership)
    return response.noContent()
  }

  async show({ request, params, response }: HttpContext) {
    const schedule = await new IntegrationService().show(
      request.header('authorization'),
      params.scheduleId
    )
    return response.ok(schedule)
  }

  async index({ request, response }: HttpContext) {
    const { from, to } = await request.validateUsing(integrationRangeValidator, {
      data: request.qs(),
    })
    const body = await new IntegrationService().list(request.header('authorization'), from, to)
    return response.ok(body)
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import GenerationService from '#services/generation_service'
import { saveGenerationDefaultValidator, suggestValidator } from '#validators/generation'

export default class GenerationsController {
  async show({ membership, response }: HttpContext) {
    return response.ok(await new GenerationService().defaults(membership))
  }

  async update({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveGenerationDefaultValidator)
    return response.ok(await new GenerationService().saveDefaults(membership, payload))
  }

  async suggest({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(suggestValidator)
    return response.ok(
      await new GenerationService().suggest(membership, params.scheduleId, payload)
    )
  }
}

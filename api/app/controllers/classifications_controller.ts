import type { HttpContext } from '@adonisjs/core/http'
import ClassificationService from '#services/classification_service'
import { createClassificationValidator } from '#validators/repertoire'
import { toClassification } from '#ministries/public_song'

export default class ClassificationsController {
  async index({ membership, response }: HttpContext) {
    const classifications = await new ClassificationService().list(membership)
    return response.ok({ classifications: classifications.map(toClassification) })
  }

  async store({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(createClassificationValidator)
    const classification = await new ClassificationService().create(
      membership,
      payload.name,
      payload.description ?? ''
    )
    return response.created(toClassification(classification))
  }

  async archive({ membership, params, response }: HttpContext) {
    const classification = await new ClassificationService().archive(
      membership,
      params.classificationId
    )
    return response.ok(toClassification(classification))
  }
}

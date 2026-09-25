import type { HttpContext } from '@adonisjs/core/http'
import MinistryFunctionService from '#services/ministry_function_service'
import {
  createFunctionValidator,
  renameFunctionValidator,
  reorderFunctionsValidator,
} from '#validators/ministry'
import { toFunctionSummary } from '#ministries/public_ministry'

export default class MinistryFunctionsController {
  async index({ membership, response }: HttpContext) {
    const functions = await new MinistryFunctionService().list(membership)
    return response.ok({ functions: functions.map(toFunctionSummary) })
  }

  async store({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(createFunctionValidator)
    const ministryFunction = await new MinistryFunctionService().create(membership, payload.name)
    return response.created(toFunctionSummary(ministryFunction))
  }

  async update({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(renameFunctionValidator)
    const ministryFunction = await new MinistryFunctionService().rename(
      membership,
      params.functionId,
      payload.name
    )
    return response.ok(toFunctionSummary(ministryFunction))
  }

  async reorder({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(reorderFunctionsValidator)
    await new MinistryFunctionService().reorder(membership, payload.ids)
    const functions = await new MinistryFunctionService().list(membership)
    return response.ok({ functions: functions.map(toFunctionSummary) })
  }

  async archive({ membership, params, response }: HttpContext) {
    const ministryFunction = await new MinistryFunctionService().archive(
      membership,
      params.functionId
    )
    return response.ok(toFunctionSummary(ministryFunction))
  }
}

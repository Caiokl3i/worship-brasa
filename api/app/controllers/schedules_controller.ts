import type { HttpContext } from '@adonisjs/core/http'
import ScheduleService from '#services/schedule_service'
import { createScheduleValidator, saveScheduleValidator } from '#validators/schedule'
import { toScheduleDetail, toScheduleSummary } from '#schedules/public_schedule'

export default class SchedulesController {
  async index({ membership, response }: HttpContext) {
    const lists = await new ScheduleService().list(membership)
    return response.ok({
      upcoming: lists.upcoming.map(toScheduleSummary),
      past: lists.past.map(toScheduleSummary),
    })
  }

  async store({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(createScheduleValidator)
    const schedule = await new ScheduleService().create(membership, payload)
    return response.created(toScheduleDetail(schedule))
  }

  async show({ membership, params, response }: HttpContext) {
    const schedule = await new ScheduleService().show(membership, params.scheduleId)
    return response.ok(toScheduleDetail(schedule))
  }

  async update({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveScheduleValidator)
    const schedule = await new ScheduleService().update(membership, params.scheduleId, payload)
    return response.ok(toScheduleDetail(schedule))
  }

  async destroy({ membership, params, response }: HttpContext) {
    await new ScheduleService().delete(membership, params.scheduleId)
    return response.noContent()
  }

  async publish({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveScheduleValidator)
    const schedule = await new ScheduleService().publish(membership, params.scheduleId, payload)
    return response.ok(toScheduleDetail(schedule))
  }

  async unpublish({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveScheduleValidator)
    const schedule = await new ScheduleService().unpublish(membership, params.scheduleId, payload)
    return response.ok(toScheduleDetail(schedule))
  }
}

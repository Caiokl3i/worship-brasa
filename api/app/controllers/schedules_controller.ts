import type { HttpContext } from '@adonisjs/core/http'
import ScheduleService from '#services/schedule_service'
import {
  absenceValidator,
  confirmScheduleValidator,
  conflictCheckValidator,
  createScheduleValidator,
  removeUnavailableValidator,
  saveScheduleValidator,
} from '#validators/schedule'
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
    const view = await new ScheduleService().create(membership, payload)
    return response.created(toScheduleDetail(view.schedule, membership, view.conflicts))
  }

  async show({ membership, params, response }: HttpContext) {
    const view = await new ScheduleService().show(membership, params.scheduleId)
    return response.ok(toScheduleDetail(view.schedule, membership, view.conflicts))
  }

  async update({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveScheduleValidator)
    const view = await new ScheduleService().update(membership, params.scheduleId, payload)
    return response.ok(toScheduleDetail(view.schedule, membership, view.conflicts))
  }

  async destroy({ membership, params, response }: HttpContext) {
    await new ScheduleService().delete(membership, params.scheduleId)
    return response.noContent()
  }

  async publish({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveScheduleValidator)
    const view = await new ScheduleService().publish(membership, params.scheduleId, payload)
    return response.ok(toScheduleDetail(view.schedule, membership, view.conflicts))
  }

  async unpublish({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveScheduleValidator)
    const view = await new ScheduleService().unpublish(membership, params.scheduleId, payload)
    return response.ok(toScheduleDetail(view.schedule, membership, view.conflicts))
  }

  async confirm({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(confirmScheduleValidator)
    const view = await new ScheduleService().confirm(membership, params.scheduleId, payload)
    return response.ok(toScheduleDetail(view.schedule, membership, view.conflicts))
  }

  async absence({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(absenceValidator)
    const view = await new ScheduleService().markAbsent(membership, params.scheduleId, payload)
    return response.ok(toScheduleDetail(view.schedule, membership, view.conflicts))
  }

  async conflicts({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(conflictCheckValidator)
    const results = await new ScheduleService().checkConflicts(membership, payload)
    return response.ok({ results })
  }

  async removeUnavailable({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(removeUnavailableValidator)
    const view = await new ScheduleService().removeUnavailable(
      membership,
      params.scheduleId,
      payload.version
    )
    return response.ok(toScheduleDetail(view.schedule, membership, view.conflicts))
  }
}

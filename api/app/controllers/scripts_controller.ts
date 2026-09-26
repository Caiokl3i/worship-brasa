import type { HttpContext } from '@adonisjs/core/http'
import ScheduleService from '#services/schedule_service'
import ScriptService from '#services/script_service'
import {
  applyScriptTemplateValidator,
  saveScheduleScriptValidator,
  saveScriptTemplateValidator,
} from '#validators/script'
import { toScheduleDetail } from '#schedules/public_schedule'
import { toScriptTemplate } from '#schedules/public_script'

export default class ScriptsController {
  async index({ membership, response }: HttpContext) {
    const templates = await new ScriptService().list(membership)
    return response.ok({ templates: templates.map(toScriptTemplate) })
  }

  async store({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveScriptTemplateValidator)
    const template = await new ScriptService().create(membership, payload.name, payload.items)
    return response.created(toScriptTemplate(template))
  }

  async update({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveScriptTemplateValidator)
    const template = await new ScriptService().update(
      membership,
      params.templateId,
      payload.name,
      payload.items
    )
    return response.ok(toScriptTemplate(template))
  }

  async save({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveScheduleScriptValidator)
    await new ScriptService().save(membership, params.scheduleId, payload)
    return response.ok(await detail(membership, params.scheduleId))
  }

  async apply({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(applyScriptTemplateValidator)
    await new ScriptService().apply(membership, params.scheduleId, payload.templateId, payload)
    return response.ok(await detail(membership, params.scheduleId))
  }
}

async function detail(membership: HttpContext['membership'], scheduleId: string) {
  const view = await new ScheduleService().show(membership, scheduleId)
  return toScheduleDetail(view.schedule, membership, view.conflicts, view.series, view.changes)
}

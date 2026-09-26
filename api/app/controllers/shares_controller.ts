import type { HttpContext } from '@adonisjs/core/http'
import ShareService from '#services/share_service'
import { shareTextValidator } from '#validators/share'

export default class SharesController {
  async text({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(shareTextValidator)
    const text = await new ShareService().text(membership, params.scheduleId, payload)
    return response.ok({ text })
  }

  async image({ membership, params, response }: HttpContext) {
    const svg = await new ShareService().image(membership, params.scheduleId)
    response.header('Content-Type', 'image/svg+xml; charset=utf-8')
    response.header('Content-Disposition', 'attachment; filename="escala.svg"')
    response.send(svg)
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import ReportService from '#services/report_service'

export default class ReportsController {
  async overview({ membership, response }: HttpContext) {
    return response.ok(await new ReportService().overview(membership))
  }

  async show({ membership, request, response }: HttpContext) {
    return response.ok(
      await new ReportService().report(membership, request.input('from'), request.input('to'))
    )
  }

  async panorama({ membership, request, response }: HttpContext) {
    return response.ok(await new ReportService().panorama(membership, request.input('month')))
  }
}

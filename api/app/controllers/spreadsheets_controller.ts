import type { HttpContext } from '@adonisjs/core/http'
import SpreadsheetService from '#services/spreadsheet_service'
import { spreadsheetValidator } from '#validators/spreadsheet'

export default class SpreadsheetsController {
  async template({ membership, response }: HttpContext) {
    const csv = new SpreadsheetService().template(membership)
    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', 'attachment; filename="modelo.csv"')
    response.send(csv)
  }

  async preview({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(spreadsheetValidator)
    const rows = await new SpreadsheetService().preview(membership, payload.csv)
    return response.ok({ rows })
  }

  async import({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(spreadsheetValidator)
    const result = await new SpreadsheetService().import(membership, payload.csv)
    return response.ok(result)
  }

  async export({ membership, response }: HttpContext) {
    const csv = await new SpreadsheetService().export(membership)
    response.header('Content-Type', 'text/csv; charset=utf-8')
    response.header('Content-Disposition', 'attachment; filename="repertorio.csv"')
    response.send(csv)
  }
}

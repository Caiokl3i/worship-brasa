import { DEFAULT_TIMEZONE } from '#constants/timezone'
import db from '@adonisjs/lucid/services/db'

export default class HealthService {
  async check() {
    await db.rawQuery('select 1')

    return {
      status: 'ok' as const,
      timezone: DEFAULT_TIMEZONE,
    }
  }
}

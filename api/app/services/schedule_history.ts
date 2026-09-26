import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import ScheduleChange from '#models/schedule_change'
import { scheduleChangeSummary, type SeriesEffect } from '#notifications/effects'

export async function recordScheduleChanges(
  trx: TransactionClientContract,
  userId: string,
  effects: SeriesEffect[],
  zone: string
) {
  for (const effect of effects) {
    const row = new ScheduleChange()
    row.useTransaction(trx)
    row.fill({
      scheduleId: effect.kind === 'saved' ? effect.after.id : effect.before.id,
      userId,
      summary: scheduleChangeSummary(effect, zone),
    })
    await row.save()
  }
}

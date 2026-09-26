import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { sendDueReminders } from '#services/notification_service'

const INTERVAL_MS = 15 * 60 * 1000

type SchedulerGlobal = typeof globalThis & {
  __worshipReminderScheduler?: ReturnType<typeof setInterval>
}

const root = globalThis as SchedulerGlobal

async function tick() {
  try {
    await sendDueReminders()
  } catch (error) {
    logger.error({ err: error }, 'Falha ao enviar os lembretes de escala')
  }
}

if (!root.__worshipReminderScheduler) {
  void tick()
  root.__worshipReminderScheduler = setInterval(() => {
    void tick()
  }, INTERVAL_MS)

  app.terminating(() => {
    if (!root.__worshipReminderScheduler) {
      return
    }
    clearInterval(root.__worshipReminderScheduler)
    root.__worshipReminderScheduler = undefined
  })
}

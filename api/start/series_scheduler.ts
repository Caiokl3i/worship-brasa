import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { materializeAllSeries } from '#services/series_service'

const DAY_MS = 24 * 60 * 60 * 1000

type SchedulerGlobal = typeof globalThis & {
  __worshipSeriesScheduler?: ReturnType<typeof setInterval>
}

const root = globalThis as SchedulerGlobal

async function tick() {
  try {
    await materializeAllSeries()
  } catch (error) {
    logger.error({ err: error }, 'Falha ao materializar as séries')
  }
}

if (!root.__worshipSeriesScheduler) {
  void tick()
  root.__worshipSeriesScheduler = setInterval(() => {
    void tick()
  }, DAY_MS)

  app.terminating(() => {
    if (!root.__worshipSeriesScheduler) {
      return
    }
    clearInterval(root.__worshipSeriesScheduler)
    root.__worshipSeriesScheduler = undefined
  })
}

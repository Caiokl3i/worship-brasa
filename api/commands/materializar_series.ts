import { BaseCommand } from '@adonisjs/core/ace'
import { materializeAllSeries } from '#services/series_service'

export default class MaterializarSeries extends BaseCommand {
  static commandName = 'materializar:series'
  static description = 'Cria as próximas ocorrências das séries de culto'
  static options = {
    startApp: true,
  }

  async run() {
    const count = await materializeAllSeries()
    this.logger.success(`Séries atualizadas: ${count}`)
  }
}

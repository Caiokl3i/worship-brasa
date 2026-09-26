import { BaseCommand } from '@adonisjs/core/ace'
import { sendDueReminders } from '#services/notification_service'

export default class LembretesEscalas extends BaseCommand {
  static commandName = 'lembretes:escalas'
  static description = 'Envia os lembretes de escala que já chegaram na hora'
  static options = {
    startApp: true,
  }

  async run() {
    const count = await sendDueReminders()
    this.logger.success(`Lembretes enviados: ${count}`)
  }
}

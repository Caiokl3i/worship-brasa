import { BaseCommand } from '@adonisjs/core/ace'
import { notifyBirthdays } from '#services/birthday_service'

export default class AniversariosAvisar extends BaseCommand {
  static commandName = 'aniversarios:avisar'
  static description = 'Avisa uma vez por membro quem faz aniversário hoje no fuso do ministério'
  static options = {
    startApp: true,
  }

  async run() {
    const count = await notifyBirthdays()
    this.logger.success(`Avisos de aniversário: ${count}`)
  }
}

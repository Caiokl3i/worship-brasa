import { BaseCommand } from '@adonisjs/core/ace'
import { countExpiredTrash } from '#services/trash_review'

export default class LixeiraRevisar extends BaseCommand {
  static commandName = 'lixeira:revisar'
  static description = 'Conta o que passou de 30 dias na lixeira e deixa os registros ocultos'
  static options = {
    startApp: true,
  }

  async run() {
    const expired = await countExpiredTrash()
    this.logger.success(
      `Fora da janela, ainda ocultos: ${expired.schedules} escalas e ${expired.songs} músicas`
    )
  }
}

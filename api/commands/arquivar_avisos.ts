import { BaseCommand } from '@adonisjs/core/ace'
import { archiveExpiredNotices } from '#services/notice_service'

export default class ArquivarAvisos extends BaseCommand {
  static commandName = 'arquivar:avisos'
  static description = 'Arquiva avisos cujo vencimento já passou'
  static options = {
    startApp: true,
  }

  async run() {
    const count = await archiveExpiredNotices()
    this.logger.success(`Avisos arquivados: ${count}`)
  }
}

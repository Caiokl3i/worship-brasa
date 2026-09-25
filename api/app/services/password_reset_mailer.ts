import logger from '@adonisjs/core/services/logger'

export interface PasswordResetMailer {
  sendCode(email: string, code: string): Promise<void>
}

class LogPasswordResetMailer implements PasswordResetMailer {
  async sendCode(email: string, code: string) {
    logger.info(`[recuperar-senha] ${email} código ${code}`)
  }
}

let current: PasswordResetMailer = new LogPasswordResetMailer()

export function getPasswordResetMailer() {
  return current
}

/** O teste troca o envio por uma lista em memória e depois devolve o log. */
export function setPasswordResetMailer(next: PasswordResetMailer) {
  current = next
}

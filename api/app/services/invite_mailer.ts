import logger from '@adonisjs/core/services/logger'

export interface InviteMailer {
  send(email: string, code: string): Promise<void>
}

class LogInviteMailer implements InviteMailer {
  async send(email: string, code: string) {
    logger.info(`[convite] ${email} código ${code}`)
  }
}

let current: InviteMailer = new LogInviteMailer()

export function getInviteMailer() {
  return current
}

export function setInviteMailer(next: InviteMailer | null) {
  current = next ?? new LogInviteMailer()
}

export class MemoryInviteMailer implements InviteMailer {
  messages: { email: string; code: string }[] = []

  async send(email: string, code: string) {
    this.messages.push({ email, code })
  }
}

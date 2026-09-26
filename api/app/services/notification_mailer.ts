import logger from '@adonisjs/core/services/logger'

export type NotificationMail = {
  email: string
  title: string
  body: string
}

export interface NotificationMailer {
  send(mail: NotificationMail): Promise<void>
}

class LogNotificationMailer implements NotificationMailer {
  async send(mail: NotificationMail) {
    logger.info(`[notificacao] ${mail.email} ${mail.title} ${mail.body}`)
  }
}

let current: NotificationMailer = new LogNotificationMailer()

export function getNotificationMailer() {
  return current
}

/** O teste troca o envio por uma lista em memória e depois devolve o log. */
export function setNotificationMailer(next: NotificationMailer) {
  current = next
}

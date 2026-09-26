import type Notification from '#models/notification'

export function toNotification(notification: Notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    link: notification.link,
    ministryId: notification.ministryId,
    readAt: notification.readAt?.toUTC().toISO() ?? null,
    createdAt: notification.createdAt.toUTC().toISO(),
  }
}

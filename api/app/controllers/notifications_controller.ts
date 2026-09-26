import type { HttpContext } from '@adonisjs/core/http'
import { toNotification } from '#notifications/public_notification'
import NotificationService from '#services/notification_service'
import { saveNotificationPreferencesValidator } from '#validators/notification'

export default class NotificationsController {
  async index({ auth, response }: HttpContext) {
    const lists = await new NotificationService().list(auth.getUserOrFail().id)
    return response.ok({
      unreadCount: lists.unreadCount,
      notifications: lists.notifications.map(toNotification),
    })
  }

  async read({ auth, params, response }: HttpContext) {
    const notification = await new NotificationService().markRead(
      auth.getUserOrFail().id,
      params.notificationId
    )
    return response.ok(toNotification(notification))
  }

  async preferences({ auth, response }: HttpContext) {
    const preferences = await new NotificationService().preferences(auth.getUserOrFail().id)
    return response.ok({ preferences })
  }

  async updatePreferences({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveNotificationPreferencesValidator)
    const preferences = await new NotificationService().savePreferences(
      auth.getUserOrFail().id,
      payload.preferences
    )
    return response.ok({ preferences })
  }
}

import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { NOTIFICATION_TYPES } from '#notifications/catalog'

const messages = new SimpleMessagesProvider({
  'preferences.required': 'Informe as preferências.',
  'preferences.minLength': 'Informe as preferências.',
  'preferences.*.type.required': 'Informe o tipo.',
  'preferences.*.type.enum': 'Informe o tipo.',
  'preferences.*.inApp.required': 'Informe se recebe no sistema.',
  'preferences.*.inApp.boolean': 'Informe se recebe no sistema.',
  'preferences.*.email.required': 'Informe se recebe por e-mail.',
  'preferences.*.email.boolean': 'Informe se recebe por e-mail.',
})

export const saveNotificationPreferencesValidator = vine.create({
  preferences: vine
    .array(
      vine.object({
        type: vine.enum(NOTIFICATION_TYPES),
        inApp: vine.boolean(),
        email: vine.boolean(),
      })
    )
    .minLength(1),
})
saveNotificationPreferencesValidator.messagesProvider = messages

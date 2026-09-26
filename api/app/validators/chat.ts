import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'body.required': 'Informe a mensagem.',
  'body.minLength': 'Informe a mensagem.',
  'body.maxLength': 'A mensagem é longa demais.',
})

export const sendChatMessageValidator = vine.create({
  body: vine.string().trim().minLength(1).maxLength(2000),
})
sendChatMessageValidator.messagesProvider = messages

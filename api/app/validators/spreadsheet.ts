import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'csv.required': 'Informe a planilha.',
})

export const spreadsheetValidator = vine.create({
  csv: vine.string().trim().maxLength(200_000),
})
spreadsheetValidator.messagesProvider = messages

import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'from.required': 'Informe a data inicial.',
  'from.regex': 'Informe a data no formato AAAA-MM-DD.',
  'to.required': 'Informe a data final.',
  'to.regex': 'Informe a data no formato AAAA-MM-DD.',
})

export const integrationRangeValidator = vine.create({
  from: vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
  to: vine
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/),
})
integrationRangeValidator.messagesProvider = messages

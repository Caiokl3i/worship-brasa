import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'preset.required': 'Escolha o modelo do texto.',
  'preset.enum': 'Escolha o modelo do texto.',
})

export const shareTextValidator = vine.create({
  preset: vine.enum(['completa', 'resumida', 'participantes', 'musicas'] as const),
  bold: vine.boolean().optional(),
  functions: vine.boolean().optional(),
  confirmations: vine.boolean().optional(),
  keys: vine.boolean().optional(),
  minister: vine.boolean().optional(),
  links: vine.boolean().optional(),
  notes: vine.boolean().optional(),
  dressCode: vine.boolean().optional(),
  confirmedOnly: vine.boolean().optional(),
})
shareTextValidator.messagesProvider = messages

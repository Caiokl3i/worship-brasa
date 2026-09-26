import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'title.required': 'Informe o título.',
  'title.minLength': 'Informe o título.',
  'title.maxLength': 'O título é longo demais.',
  'body.required': 'Informe o texto.',
  'body.minLength': 'Informe o texto.',
  'body.maxLength': 'O texto é longo demais.',
  'pinned.required': 'Informe se o aviso fica em destaque.',
  'pinned.boolean': 'Informe se o aviso fica em destaque.',
  'expiresAt.date': 'Informe a data no formato AAAA-MM-DD.',
})

export const saveNoticeValidator = vine.create({
  title: vine.string().trim().minLength(1).maxLength(160),
  body: vine.string().trim().minLength(1).maxLength(4000),
  pinned: vine.boolean(),
  expiresAt: vine
    .date({ formats: ['YYYY-MM-DD'] })
    .nullable()
    .optional(),
})
saveNoticeValidator.messagesProvider = messages

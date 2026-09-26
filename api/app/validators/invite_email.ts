import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'email.required': 'Informe o e-mail.',
  'email.email': 'Informe um e-mail válido.',
  'name.required': 'Informe o nome.',
  'name.minLength': 'Informe o nome.',
  'code.required': 'Informe o código.',
  'code.fixedLength': 'O código tem 6 dígitos.',
  'password.required': 'Informe a senha.',
  'password.minLength': 'A senha precisa ter no mínimo 8 caracteres.',
  'passwordConfirmation.required': 'Confirme a senha.',
  'passwordConfirmation.sameAs': 'A confirmação não é igual à senha.',
})

export const sendInviteEmailValidator = vine.create({
  email: vine.string().trim().email().maxLength(254).toLowerCase(),
})
sendInviteEmailValidator.messagesProvider = messages

export const activateInviteValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  email: vine.string().trim().email().maxLength(254).toLowerCase(),
  code: vine.string().trim().fixedLength(6),
  password: vine.string().minLength(8).maxLength(128),
  passwordConfirmation: vine.string().sameAs('password'),
})
activateInviteValidator.messagesProvider = messages

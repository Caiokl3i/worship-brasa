import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'name.required': 'Informe o nome.',
  'name.minLength': 'Informe o nome.',
  'email.required': 'Informe o e-mail.',
  'email.email': 'Informe um e-mail válido.',
  'email.unique': 'Este e-mail já está em uso.',
  'email.database.unique': 'Este e-mail já está em uso.',
  'password.required': 'Informe a senha.',
  'password.minLength': 'A senha precisa ter no mínimo 8 caracteres.',
  'passwordConfirmation.required': 'Confirme a senha.',
  'passwordConfirmation.sameAs': 'A confirmação não é igual à senha.',
  'currentPassword.required': 'Informe a senha atual.',
  'code.required': 'Informe o código.',
  'code.fixedLength': 'O código tem 6 dígitos.',
  'birthDate.date': 'Informe a data no formato AAAA-MM-DD.',
})

const email = () => vine.string().trim().email().maxLength(254).toLowerCase()
const password = () => vine.string().minLength(8).maxLength(128)

export const registerValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  email: email().unique({ table: 'users', column: 'email' }),
  password: password(),
  passwordConfirmation: vine.string().sameAs('password'),
})
registerValidator.messagesProvider = messages

export const loginValidator = vine.create({
  email: email(),
  password: vine.string(),
})
loginValidator.messagesProvider = messages

export const requestResetValidator = vine.create({
  email: email(),
})
requestResetValidator.messagesProvider = messages

export const confirmResetValidator = vine.create({
  email: email(),
  code: vine.string().trim().fixedLength(6),
  password: password(),
  passwordConfirmation: vine.string().sameAs('password'),
})
confirmResetValidator.messagesProvider = messages

export const updateProfileValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(120),
  birthDate: vine
    .date({ formats: ['YYYY-MM-DD'] })
    .nullable()
    .optional(),
})
updateProfileValidator.messagesProvider = messages

export const changePasswordValidator = vine.create({
  currentPassword: vine.string(),
  password: password(),
  passwordConfirmation: vine.string().sameAs('password'),
})
changePasswordValidator.messagesProvider = messages

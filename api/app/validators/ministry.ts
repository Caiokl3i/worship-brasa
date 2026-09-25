import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'name.required': 'Informe o nome.',
  'name.minLength': 'Informe o nome.',
  'name.maxLength': 'O nome é longo demais.',
  'timezone.required': 'Informe o fuso.',
  'color.required': 'Informe a cor.',
  'color.regex': 'Informe a cor no formato #RRGGBB.',
  'code.required': 'Informe o código.',
  'code.fixedLength': 'O código tem 6 caracteres.',
  'functions.*.minLength': 'Informe o nome da função.',
  'functions.*.maxLength': 'O nome da função é longo demais.',
  'ids.required': 'Informe a ordem das funções.',
  'functionIds.required': 'Informe as funções.',
})

const name = () => vine.string().trim().minLength(1).maxLength(120)
const functionName = () => vine.string().trim().minLength(1).maxLength(80)

export const createMinistryValidator = vine.create({
  name: name(),
  functions: vine.array(functionName()).optional(),
})
createMinistryValidator.messagesProvider = messages

export const updateMinistryValidator = vine.create({
  name: name(),
  timezone: vine.string().trim().maxLength(64),
  color: vine
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/),
})
updateMinistryValidator.messagesProvider = messages

export const enterInviteValidator = vine.create({
  code: vine.string().trim().fixedLength(6).toUpperCase(),
})
enterInviteValidator.messagesProvider = messages

export const createFunctionValidator = vine.create({
  name: functionName(),
})
createFunctionValidator.messagesProvider = messages

export const renameFunctionValidator = vine.create({
  name: functionName(),
})
renameFunctionValidator.messagesProvider = messages

export const reorderFunctionsValidator = vine.create({
  ids: vine.array(vine.string().uuid()),
})
reorderFunctionsValidator.messagesProvider = messages

export const updateMemberValidator = vine.create({
  isAdmin: vine.boolean().optional(),
  canManageSchedules: vine.boolean().optional(),
  canManageRepertoire: vine.boolean().optional(),
  canManageFunctions: vine.boolean().optional(),
  canEditScheduleSongs: vine.boolean().optional(),
})
updateMemberValidator.messagesProvider = messages

export const assignFunctionsValidator = vine.create({
  functionIds: vine.array(vine.string().uuid()),
})
assignFunctionsValidator.messagesProvider = messages

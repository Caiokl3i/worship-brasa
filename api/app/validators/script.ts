import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'name.required': 'Informe o nome.',
  'name.minLength': 'Informe o nome.',
  'name.maxLength': 'O nome é longo demais.',
  'items.required': 'Informe os itens.',
  'items.*.title.required': 'Informe o título.',
  'items.*.title.minLength': 'Informe o título.',
  'items.*.title.maxLength': 'O título é longo demais.',
  'items.*.notes.maxLength': 'A observação é longa demais.',
  'items.*.durationSeconds.min': 'A duração precisa ser maior que zero.',
  'items.*.durationSeconds.max': 'A duração é longa demais.',
  'version.required': 'Esta escala foi alterada, reabra.',
  'version.number': 'Esta escala foi alterada, reabra.',
  'version.min': 'Esta escala foi alterada, reabra.',
  'templateId.uuid': 'Modelo de roteiro não encontrado.',
  'scope.enum': 'Escolha o alcance da alteração.',
})

const scriptItem = vine.object({
  title: vine.string().trim().minLength(1).maxLength(160),
  notes: vine.string().trim().maxLength(2000).optional(),
  durationSeconds: vine.number().min(1).max(86400).nullable().optional(),
})

export const saveScriptTemplateValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(160),
  items: vine.array(scriptItem),
})
saveScriptTemplateValidator.messagesProvider = messages

export const saveScheduleScriptValidator = vine.create({
  version: vine.number().min(1),
  items: vine.array(scriptItem),
  scope: vine.enum(['only_this', 'this_and_following', 'all']).optional(),
  replaceFilled: vine.boolean().optional(),
})
saveScheduleScriptValidator.messagesProvider = messages

export const applyScriptTemplateValidator = vine.create({
  version: vine.number().min(1),
  templateId: vine.string().uuid(),
  scope: vine.enum(['only_this', 'this_and_following', 'all']).optional(),
  replaceFilled: vine.boolean().optional(),
})
applyScriptTemplateValidator.messagesProvider = messages

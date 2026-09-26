import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'title.required': 'Informe o título.',
  'title.minLength': 'Informe o título.',
  'title.maxLength': 'O título é longo demais.',
  'startsAt.required': 'Informe o início.',
  'notes.maxLength': 'As observações são longas demais.',
  'dressCode.maxLength': 'A vestimenta é longa demais.',
  'version.required': 'Esta escala foi alterada, reabra.',
  'version.number': 'Esta escala foi alterada, reabra.',
  'version.min': 'Esta escala foi alterada, reabra.',
  'participants.required': 'Informe a equipe.',
  'participants.*.membershipId.uuid': 'Este membro não pode entrar nesta escala.',
  'participants.*.functionIds.required': 'Escolha ao menos uma função.',
  'songs.required': 'Informe as músicas.',
  'songs.*.songId.uuid': 'Esta música não pode entrar nesta escala.',
  'songs.*.notes.maxLength': 'A observação é longa demais.',
  'songs.*.durationSeconds.min': 'A duração precisa ser maior que zero.',
  'songs.*.durationSeconds.max': 'A duração é longa demais.',
  'scope.enum': 'Escolha o alcance da alteração.',
  'interval.min': 'O intervalo precisa ser pelo menos 1.',
  'occurrenceCount.min': 'Informe quantas vezes.',
})

const header = {
  title: vine.string().trim().minLength(1).maxLength(160),
  startsAt: vine.string().trim().minLength(1),
  endsAt: vine.string().trim().nullable().optional(),
  notes: vine.string().trim().maxLength(4000).optional(),
  dressCode: vine.string().trim().maxLength(200).optional(),
  confirmationRequired: vine.boolean().optional(),
}

const repeat = vine.object({
  frequency: vine.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: vine.number().min(1).max(366),
  weekdays: vine.array(vine.number().min(1).max(7)).optional(),
  endsMode: vine.enum(['never', 'on_date', 'after_count']),
  endsOn: vine.string().trim().nullable().optional(),
  occurrenceCount: vine.number().min(1).max(366).nullable().optional(),
})

export const createScheduleValidator = vine.create({
  ...header,
  repeat: repeat.optional(),
})
createScheduleValidator.messagesProvider = messages

const highlight = vine.object({
  membershipId: vine.string().uuid(),
  functionId: vine.string().uuid(),
})

export const saveScheduleValidator = vine.create({
  ...header,
  version: vine.number().min(1),
  participants: vine.array(
    vine.object({
      membershipId: vine.string().uuid(),
      functionIds: vine.array(vine.string().uuid()),
    })
  ),
  songs: vine.array(
    vine.object({
      songId: vine.string().uuid(),
      versionId: vine.string().uuid().nullable().optional(),
      keyOverride: vine.string().trim().maxLength(8).nullable().optional(),
      notes: vine.string().trim().maxLength(2000).optional(),
      durationSeconds: vine.number().min(1).max(86400).nullable().optional(),
      highlights: vine.array(highlight),
    })
  ),
  scope: vine.enum(['only_this', 'this_and_following', 'all']).optional(),
  replaceFilled: vine.boolean().optional(),
})
saveScheduleValidator.messagesProvider = messages

export const deleteScheduleValidator = vine.create({
  scope: vine.enum(['only_this', 'this_and_following', 'all']),
  replaceFilled: vine.boolean().optional(),
})
deleteScheduleValidator.messagesProvider = messages

export const saveUnavailabilityValidator = vine.create({
  membershipId: vine.string().uuid().optional(),
  startsOn: vine.string().trim().minLength(1),
  endsOn: vine.string().trim().minLength(1),
  description: vine.string().trim().maxLength(2000).optional(),
})
saveUnavailabilityValidator.messagesProvider = messages

export const confirmScheduleValidator = vine.create({
  confirmation: vine.enum(['confirmed', 'declined']),
  membershipId: vine.string().uuid().optional(),
})
confirmScheduleValidator.messagesProvider = messages

export const absenceValidator = vine.create({
  membershipId: vine.string().uuid(),
  absent: vine.boolean(),
})
absenceValidator.messagesProvider = messages

export const conflictCheckValidator = vine.create({
  startsAt: vine.string().trim().minLength(1),
  endsAt: vine.string().trim().nullable().optional(),
  ignoreScheduleId: vine.string().uuid().nullable().optional(),
  membershipIds: vine.array(vine.string().uuid()),
})
conflictCheckValidator.messagesProvider = messages

export const removeUnavailableValidator = vine.create({
  version: vine.number().min(1),
})
removeUnavailableValidator.messagesProvider = messages

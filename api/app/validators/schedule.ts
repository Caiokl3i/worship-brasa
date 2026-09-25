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
})

const header = {
  title: vine.string().trim().minLength(1).maxLength(160),
  startsAt: vine.string().trim().minLength(1),
  endsAt: vine.string().trim().nullable().optional(),
  notes: vine.string().trim().maxLength(4000).optional(),
  dressCode: vine.string().trim().maxLength(200).optional(),
}

export const createScheduleValidator = vine.create(header)
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
})
saveScheduleValidator.messagesProvider = messages

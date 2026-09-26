import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'peopleStrategy.enum': 'Escolha como escolher as pessoas.',
  'historyMonths.min': 'Informe de 1 a 12 meses.',
  'historyMonths.max': 'Informe de 1 a 12 meses.',
  'historyMonths.number': 'Informe de 1 a 12 meses.',
  'minGapDays.min': 'O intervalo mínimo não pode ser negativo.',
  'minGapDays.max': 'O intervalo mínimo é longo demais.',
  'songStrategy.enum': 'Escolha como escolher as músicas.',
  'songCount.min': 'Informe quantas músicas.',
  'songCount.max': 'Informe até 50 músicas.',
  'songCount.number': 'Informe quantas músicas.',
  'minSongGapDays.min': 'O intervalo mínimo não pode ser negativo.',
  'minSongGapDays.max': 'O intervalo mínimo é longo demais.',
  'unavailability.enum': 'Escolha o que fazer com indisponíveis.',
  'conflict.enum': 'Escolha o que fazer com conflitos.',
  'vacancies.*.functionId.uuid': 'Escolha uma função do ministério.',
  'vacancies.*.quantity.min': 'A quantidade não pode ser negativa.',
  'vacancies.*.quantity.max': 'A quantidade é alta demais.',
  'fixed.*.membershipId.uuid': 'Este membro não pode entrar nesta escala.',
  'excludedMembershipIds.*.uuid': 'Este membro não pode entrar nesta escala.',
})

const vacancy = vine.object({
  functionId: vine.string().uuid(),
  quantity: vine.number().min(0).max(50),
})

const options = {
  peopleStrategy: vine.enum(['balanced', 'most_active', 'least_active', 'weekday'] as const),
  historyMonths: vine.number().min(1).max(12),
  minGapDays: vine.number().min(0).max(3650).nullable().optional(),
  preferFewerAbsences: vine.boolean(),
  allowMultipleFunctions: vine.boolean(),
  unavailability: vine.enum(['respect', 'warn'] as const),
  conflict: vine.enum(['skip', 'warn', 'ignore'] as const),
  songStrategy: vine.enum(['rotation', 'most_played', 'balanced'] as const),
  songCount: vine.number().min(0).max(50),
  minSongGapDays: vine.number().min(0).max(3650).nullable().optional(),
  includeUnplayed: vine.boolean(),
  vacancies: vine.array(vacancy),
}

export const saveGenerationDefaultValidator = vine.create(options)
saveGenerationDefaultValidator.messagesProvider = messages

export const suggestValidator = vine.create({
  ...options,
  fixed: vine.array(
    vine.object({
      membershipId: vine.string().uuid(),
      functionIds: vine.array(vine.string().uuid()),
    })
  ),
  excludedMembershipIds: vine.array(vine.string().uuid()),
})
suggestValidator.messagesProvider = messages

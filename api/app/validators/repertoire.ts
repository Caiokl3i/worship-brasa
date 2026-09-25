import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'title.required': 'Informe o título.',
  'title.minLength': 'O título precisa de pelo menos 2 caracteres.',
  'title.maxLength': 'O título é longo demais.',
  'artist.maxLength': 'O artista é longo demais.',
  'bpm.min': 'O BPM precisa estar entre 1 e 400.',
  'bpm.max': 'O BPM precisa estar entre 1 e 400.',
  'bpm.number': 'O BPM precisa estar entre 1 e 400.',
  'durationSeconds.min': 'A duração precisa ser maior que zero.',
  'durationSeconds.max': 'A duração é longa demais.',
  'durationSeconds.number': 'A duração precisa ser maior que zero.',
  'versions.required': 'Informe as versões.',
  'versions.*.name.required': 'Informe o nome da versão.',
  'versions.*.name.minLength': 'Informe o nome da versão.',
  'versions.*.name.maxLength': 'O nome da versão é longo demais.',
  'links.required': 'Informe os links.',
  'links.*.label.required': 'Informe o rótulo do link.',
  'links.*.label.minLength': 'Informe o rótulo do link.',
  'links.*.label.maxLength': 'O rótulo do link é longo demais.',
  'links.*.url.required': 'Informe o link.',
  'links.*.url.maxLength': 'O link é longo demais.',
  'links.*.kind.required': 'Informe o tipo do link.',
  'name.required': 'Informe o nome.',
  'name.minLength': 'Informe o nome.',
  'name.maxLength': 'O nome é longo demais.',
  'description.maxLength': 'A descrição é longa demais.',
})

const optionalText = (maxLength: number) =>
  vine.string().trim().maxLength(maxLength).nullable().optional()

export const saveSongValidator = vine.create({
  title: vine.string().trim().minLength(2).maxLength(160),
  artist: optionalText(160),
  bpm: vine.number().min(1).max(400).nullable().optional(),
  durationSeconds: vine.number().min(1).max(86400).nullable().optional(),
  defaultKey: optionalText(8),
  classificationId: vine.string().uuid().nullable().optional(),
  folderId: vine.string().uuid().nullable().optional(),
  versions: vine.array(
    vine.object({
      name: vine.string().trim().minLength(1).maxLength(80),
      key: optionalText(8),
    })
  ),
  links: vine.array(
    vine.object({
      versionIndex: vine.number().min(0).nullable().optional(),
      kind: vine.string().trim().maxLength(16),
      label: vine.string().trim().minLength(1).maxLength(80),
      url: vine.string().trim().maxLength(500),
    })
  ),
})
saveSongValidator.messagesProvider = messages

const folderName = () => vine.string().trim().minLength(1).maxLength(80)

export const createFolderValidator = vine.create({
  name: folderName(),
})
createFolderValidator.messagesProvider = messages

export const renameFolderValidator = vine.create({
  name: folderName(),
})
renameFolderValidator.messagesProvider = messages

export const createClassificationValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(80),
  description: vine.string().trim().maxLength(400).optional(),
})
createClassificationValidator.messagesProvider = messages

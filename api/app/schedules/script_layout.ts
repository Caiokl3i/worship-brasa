export const SONG_BLOCK_TITLE = 'Louvor'

export const DEFAULT_SCRIPT_TEMPLATE_NAME = 'Culto'

export const DEFAULT_SCRIPT_TITLES = [
  'Abertura',
  'Oração',
  'Boas-vindas',
  SONG_BLOCK_TITLE,
  'Palavra',
  'Oferta',
  'Avisos',
  'Encerramento',
]

export type ScriptSource = 'manual' | 'songs'

export type ScriptDraft = {
  title: string
  notes: string
  durationSeconds: number | null
}

export type ScriptSong = ScriptDraft & {
  effectiveKey: string
}

export type ScriptRow = ScriptDraft & {
  source: ScriptSource
  effectiveKey: string | null
  locked: boolean
}

export function isSongBlockTitle(title: string) {
  return title.trim().toLocaleLowerCase('pt-BR') === SONG_BLOCK_TITLE.toLocaleLowerCase('pt-BR')
}

export function summedDuration(items: Array<{ durationSeconds: number | null }>) {
  const known = items
    .map((item) => item.durationSeconds)
    .filter((value): value is number => value !== null)
  if (known.length === 0) {
    return null
  }
  return known.reduce((total, value) => total + value, 0)
}

export function arrangeScript(input: {
  manuals: ScriptDraft[]
  songs: ScriptSong[]
  blockIndex: number | null
  blockNotes?: string
}) {
  const index =
    input.blockIndex === null
      ? input.songs.length > 0
        ? input.manuals.length
        : null
      : input.blockIndex
  if (index === null) {
    return input.manuals.map(manualRow)
  }

  const clamped = Math.min(Math.max(index, 0), input.manuals.length)
  const songRows =
    input.songs.length > 0
      ? input.songs.map((song) => songRow(song))
      : [
          songRow({
            title: SONG_BLOCK_TITLE,
            notes: input.blockNotes ?? '',
            durationSeconds: null,
            effectiveKey: '',
          }),
        ]

  return [
    ...input.manuals.slice(0, clamped).map(manualRow),
    ...songRows,
    ...input.manuals.slice(clamped).map(manualRow),
  ]
}

export function layoutFromParts(items: ScriptDraft[], songs: ScriptSong[]) {
  const manuals: ScriptDraft[] = []
  let blockIndex: number | null = null
  let blockNotes = ''

  for (const item of items) {
    if (isSongBlockTitle(item.title)) {
      if (blockIndex === null) {
        blockIndex = manuals.length
        blockNotes = item.notes
      }
      continue
    }
    manuals.push(item)
  }

  return arrangeScript({ manuals, songs, blockIndex, blockNotes })
}

export function layoutFromRows(
  items: Array<ScriptDraft & { source: ScriptSource }>,
  songs: ScriptSong[]
) {
  const manuals: ScriptDraft[] = []
  let blockIndex: number | null = null
  let blockNotes = ''

  for (const item of items) {
    const anchor = item.source === 'songs' || isSongBlockTitle(item.title)
    if (anchor) {
      if (blockIndex === null) {
        blockIndex = manuals.length
        blockNotes = item.source === 'manual' ? item.notes : ''
      }
      continue
    }
    manuals.push({
      title: item.title,
      notes: item.notes,
      durationSeconds: item.durationSeconds,
    })
  }

  return arrangeScript({ manuals, songs, blockIndex, blockNotes })
}

function manualRow(item: ScriptDraft): ScriptRow {
  return {
    source: 'manual',
    title: item.title,
    notes: item.notes,
    durationSeconds: item.durationSeconds,
    effectiveKey: null,
    locked: false,
  }
}

function songRow(item: ScriptSong): ScriptRow {
  return {
    source: 'songs',
    title: item.title,
    notes: item.notes,
    durationSeconds: item.durationSeconds,
    effectiveKey: item.effectiveKey || null,
    locked: true,
  }
}

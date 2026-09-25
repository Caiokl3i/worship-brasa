export const SONG_KEYS = [
  'C',
  'C#',
  'D',
  'Eb',
  'E',
  'F',
  'F#',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
  'Cm',
  'C#m',
  'Dm',
  'Ebm',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'Abm',
  'Am',
  'Bbm',
  'Bm',
]

export const LINK_KINDS = [
  { value: 'cifra', label: 'Cifra' },
  { value: 'letra', label: 'Letra' },
  { value: 'video', label: 'Vídeo' },
  { value: 'audio', label: 'Áudio' },
  { value: 'custom', label: 'Outro' },
] as const

export type LinkKind = (typeof LINK_KINDS)[number]['value']

export type FolderItem = {
  id: string
  name: string
}

export type ClassificationItem = {
  id: string
  name: string
  description: string
  archived: boolean
}

export type SongSummary = {
  id: string
  title: string
  artist: string | null
  bpm: number | null
  durationSeconds: number | null
  defaultKey: string | null
  folder: FolderItem | null
  classification: ClassificationItem | null
}

export type SongVersionItem = {
  id: string
  name: string
  key: string | null
}

export type SongLinkItem = {
  id: string
  versionId: string | null
  kind: LinkKind
  label: string
  url: string
}

export type SongDetail = SongSummary & {
  versions: SongVersionItem[]
  links: SongLinkItem[]
}

export function formatDuration(seconds: number | null) {
  if (!seconds) {
    return ''
  }
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

import { DateTime } from 'luxon'

export type SharePreset = 'completa' | 'resumida' | 'participantes' | 'musicas'

export type ShareOptions = {
  team: boolean
  songs: boolean
  functions: boolean
  confirmations: boolean
  keys: boolean
  minister: boolean
  links: boolean
  notes: boolean
  dressCode: boolean
  confirmedOnly: boolean
  bold: boolean
}

export type ShareRequest = {
  preset: SharePreset
  bold?: boolean
  functions?: boolean
  confirmations?: boolean
  keys?: boolean
  minister?: boolean
  links?: boolean
  notes?: boolean
  dressCode?: boolean
  confirmedOnly?: boolean
}

export type SharePerson = {
  membershipId: string
  name: string
  confirmation: 'pending' | 'confirmed' | 'declined'
  functions: { name: string; sortOrder: number }[]
}

export type ShareSong = {
  title: string
  effectiveKey: string
  notes: string
  links: { url: string }[]
}

export type ShareSnapshot = {
  zone: string
  ministryName: string
  ministryColor: string
  title: string
  startsAt: string
  endsAt: string | null
  notes: string
  dressCode: string
  viewerManages: boolean
  viewerMembershipId: string
  participants: SharePerson[]
  songs: ShareSong[]
}

const PRESETS: Record<SharePreset, ShareOptions> = {
  completa: {
    team: true,
    songs: true,
    functions: true,
    confirmations: true,
    keys: true,
    minister: true,
    links: true,
    notes: true,
    dressCode: true,
    confirmedOnly: false,
    bold: false,
  },
  resumida: {
    team: true,
    songs: true,
    functions: true,
    confirmations: false,
    keys: true,
    minister: false,
    links: false,
    notes: false,
    dressCode: false,
    confirmedOnly: false,
    bold: false,
  },
  participantes: {
    team: true,
    songs: false,
    functions: true,
    confirmations: false,
    keys: false,
    minister: false,
    links: false,
    notes: false,
    dressCode: false,
    confirmedOnly: false,
    bold: false,
  },
  musicas: {
    team: false,
    songs: true,
    functions: false,
    confirmations: false,
    keys: true,
    minister: false,
    links: false,
    notes: false,
    dressCode: false,
    confirmedOnly: false,
    bold: false,
  },
}

const OPTION_KEYS = [
  'bold',
  'functions',
  'confirmations',
  'keys',
  'minister',
  'links',
  'notes',
  'dressCode',
  'confirmedOnly',
] as const

const STATUS_LABEL = {
  confirmed: 'Confirmado',
  declined: 'Não participarei',
  pending: 'Pendente',
} as const

const IMAGE_LINE_LIMIT = 12

export function resolveShareOptions(request: ShareRequest): ShareOptions {
  const options = { ...PRESETS[request.preset] }
  for (const key of OPTION_KEYS) {
    const value = request[key]
    if (value !== undefined) {
      options[key] = value
    }
  }
  return options
}

export function renderScheduleText(snapshot: ShareSnapshot, options: ShareOptions) {
  const when = writtenWhen(snapshot)
  const sections = [
    [mark(snapshot.title, options.bold), when, snapshot.ministryName].join('\n'),
    teamSection(snapshot, options),
    songsSection(snapshot, options),
    noteSection('Observações', snapshot.notes, options.notes),
    noteSection('Vestimenta', snapshot.dressCode, options.dressCode),
  ]
  return sections.filter((section): section is string => section !== null).join('\n\n')
}

export function renderScheduleImage(snapshot: ShareSnapshot) {
  const when = writtenWhen(snapshot)
  const lines = imageLines(snapshot)
  const overflow = lines.length > IMAGE_LINE_LIMIT
  const shown = overflow
    ? [...lines.slice(0, IMAGE_LINE_LIMIT), 'lista completa no sistema']
    : lines
  const fill = safeColor(snapshot.ministryColor)
  const body = shown
    .map((line, index) => `<text x="64" y="${320 + index * 56}" font-size="32">${xml(line)}</text>`)
    .join('\n')

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">',
    `<rect width="1080" height="28" fill="${fill}"/>`,
    '<g font-family="sans-serif" fill="#1c1917">',
    `<text x="64" y="120" font-size="28">${xml(snapshot.ministryName)}</text>`,
    `<text x="64" y="180" font-size="48">${xml(snapshot.title)}</text>`,
    `<text x="64" y="240" font-size="28">${xml(when)}</text>`,
    body,
    '</g>',
    '</svg>',
  ].join('\n')
}

function teamSection(snapshot: ShareSnapshot, options: ShareOptions) {
  if (!options.team) {
    return null
  }
  const people = visiblePeople(snapshot, options)
  if (people.length === 0) {
    return null
  }
  if (!options.functions) {
    return ['Equipe', ...people.map((person) => personLine(person, snapshot, options))].join('\n')
  }

  const rows = people.flatMap((person) => person.functions.map((item) => ({ person, item })))
  rows.sort((left, right) =>
    compareFunctions(left.item, right.item, left.person, right.person, options)
  )

  const lines: string[] = []
  let current = ''
  let names: string[] = []
  const flush = () => {
    if (names.length === 0) {
      return
    }
    lines.push(`${current}: ${names.join(', ')}`)
    names = []
  }
  for (const row of rows) {
    if (row.item.name !== current) {
      flush()
      current = row.item.name
    }
    names.push(personLine(row.person, snapshot, options))
  }
  flush()
  return ['Equipe', ...lines].join('\n')
}

function personLine(person: SharePerson, snapshot: ShareSnapshot, options: ShareOptions) {
  const name = mark(person.name, options.bold)
  const status = statusLabel(person, snapshot, options)
  return status ? `${name} — ${status}` : name
}

function songsSection(snapshot: ShareSnapshot, options: ShareOptions) {
  if (!options.songs || snapshot.songs.length === 0) {
    return null
  }
  const lines: string[] = ['Músicas']
  snapshot.songs.forEach((song, index) => {
    const title = mark(song.title, options.bold)
    const key = options.keys && song.effectiveKey ? ` — ${song.effectiveKey}` : ''
    lines.push(`${index + 1}. ${title}${key}`)
    if (options.links) {
      for (const link of song.links) {
        lines.push(link.url)
      }
    }
    if (options.notes && song.notes.trim()) {
      lines.push(song.notes.trim())
    }
  })
  return lines.join('\n')
}

function noteSection(title: string, value: string, enabled: boolean) {
  const trimmed = value.trim()
  if (!enabled || !trimmed) {
    return null
  }
  return `${title}\n${trimmed}`
}

function visiblePeople(snapshot: ShareSnapshot, options: ShareOptions) {
  return snapshot.participants.filter(
    (person) => !options.confirmedOnly || person.confirmation === 'confirmed'
  )
}

function statusLabel(person: SharePerson, snapshot: ShareSnapshot, options: ShareOptions) {
  if (!options.confirmations) {
    return null
  }
  const own = person.membershipId === snapshot.viewerMembershipId
  if (!snapshot.viewerManages && !own) {
    return null
  }
  return STATUS_LABEL[person.confirmation]
}

function compareFunctions(
  left: { name: string; sortOrder: number },
  right: { name: string; sortOrder: number },
  leftPerson: SharePerson,
  rightPerson: SharePerson,
  options: ShareOptions
) {
  const rank = ministerRank(left.name, options) - ministerRank(right.name, options)
  if (rank !== 0) {
    return rank
  }
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder
  }
  const name = left.name.localeCompare(right.name, 'pt')
  if (name !== 0) {
    return name
  }
  return leftPerson.name.localeCompare(rightPerson.name, 'pt')
}

function ministerRank(name: string, options: ShareOptions) {
  if (!options.minister) {
    return 1
  }
  return name.localeCompare('Ministro', 'pt', { sensitivity: 'accent' }) === 0 ? 0 : 1
}

function imageLines(snapshot: ShareSnapshot) {
  const songs = snapshot.songs.map((song) =>
    song.effectiveKey ? `${song.title} — ${song.effectiveKey}` : song.title
  )
  const rows = snapshot.participants.flatMap((person) =>
    person.functions.map((item) => ({ person, item }))
  )
  rows.sort((left, right) =>
    compareFunctions(left.item, right.item, left.person, right.person, {
      ...PRESETS.resumida,
      minister: false,
    })
  )
  const people = rows.map((row) => `${row.item.name}: ${row.person.name}`)
  return [...songs, ...people]
}

function writtenWhen(snapshot: ShareSnapshot) {
  const start = DateTime.fromISO(snapshot.startsAt, { setZone: true }).setZone(snapshot.zone)
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: snapshot.zone,
  }).format(start.toJSDate())
  const clock = `${pad(start.hour)}:${pad(start.minute)}`
  if (!snapshot.endsAt) {
    return `${label} · ${clock}`
  }
  const end = DateTime.fromISO(snapshot.endsAt, { setZone: true }).setZone(snapshot.zone)
  return `${label} · ${clock}–${pad(end.hour)}:${pad(end.minute)}`
}

function mark(value: string, bold: boolean) {
  return bold ? `*${value}*` : value
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function safeColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#1c1917'
}

function xml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

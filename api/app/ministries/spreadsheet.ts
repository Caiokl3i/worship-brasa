export const REPERTOIRE_COLUMNS = [
  'título',
  'artista',
  'tom',
  'BPM',
  'classificação',
  'link de cifra',
  'link de vídeo',
] as const

export type SpreadsheetRow = {
  title: string
  artist: string
  key: string
  bpm: string
  classification: string
  cifra: string
  video: string
}

export function repertoireTemplate() {
  return `${REPERTOIRE_COLUMNS.join(',')}\n`
}

export function parseRepertoireCsv(text: string) {
  const table = parseCsv(text.replace(/^\uFEFF/, ''))
  if (table.length === 0) {
    return []
  }

  const header = table[0].map((cell) => cell.trim().toLowerCase())
  const at = (name: string) => header.indexOf(name.toLowerCase())
  const rows: SpreadsheetRow[] = []

  for (const cells of table.slice(1)) {
    if (cells.every((cell) => cell.trim() === '')) {
      continue
    }
    rows.push({
      title: read(cells, at('título')),
      artist: read(cells, at('artista')),
      key: read(cells, at('tom')),
      bpm: read(cells, at('bpm')),
      classification: read(cells, at('classificação')),
      cifra: read(cells, at('link de cifra')),
      video: read(cells, at('link de vídeo')),
    })
  }

  return rows
}

export function toRepertoireCsv(
  songs: Array<{
    title: string
    artist: string | null
    defaultKey: string | null
    bpm: number | null
    classification: string
    cifra: string
    video: string
  }>
) {
  const lines = [REPERTOIRE_COLUMNS.join(',')]
  for (const song of songs) {
    lines.push(
      [
        song.title,
        song.artist ?? '',
        song.defaultKey ?? '',
        song.bpm === null ? '' : String(song.bpm),
        song.classification,
        song.cifra,
        song.video,
      ]
        .map(escapeCell)
        .join(',')
    )
  }
  return `${lines.join('\n')}\n`
}

function read(cells: string[], index: number) {
  if (index < 0) {
    return ''
  }
  return cells[index]?.trim() ?? ''
}

function escapeCell(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function parseCsv(text: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"'
          index += 1
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }

    if (char === '"') {
      quoted = true
      continue
    }
    if (char === ',') {
      row.push(cell)
      cell = ''
      continue
    }
    if (char === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      continue
    }
    if (char !== '\r') {
      cell += char
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  return rows
}

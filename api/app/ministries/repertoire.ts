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
] as const

export const LINK_KINDS = ['cifra', 'letra', 'video', 'audio', 'custom'] as const

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export type LinkKind = (typeof LINK_KINDS)[number]

export const DEFAULT_CLASSIFICATIONS = [
  { name: 'Adoração', description: 'Reconhecimento a Deus pelo que Ele é.' },
  { name: 'Alegria', description: 'Alegria pelo Senhor e pelos Seus feitos.' },
  { name: 'Consagração', description: 'Dedicação da vida e santificação.' },
  {
    name: 'Contemplação',
    description: 'Meditação na pessoa de Deus, caráter, natureza e qualidades.',
  },
  { name: 'Louvor', description: 'Elogio e agradecimento pelo que Deus fez, faz ou fará.' },
  { name: 'Especiais', description: 'Casamento, batizado e temas semelhantes.' },
] as const

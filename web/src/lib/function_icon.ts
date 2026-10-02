const ICONS: Record<string, string> = {
  Ministro: '🎤',
  Vocalista: '🎤',
  Vocal: '🎤',
  'Backing vocal': '🎙️',
  Violão: '🎸',
  Guitarra: '🎸',
  Baixo: '🎸',
  Teclado: '🎹',
  Piano: '🎹',
  Bateria: '🥁',
  Percussão: '🥁',
  'Mesa de som': '🎚️',
  Projeção: '📽️',
  Som: '🎚️',
  Transmissão: '📡',
  Iluminação: '💡',
  Câmera: '📷',
  Regente: '🎼',
  Soprano: '🎤',
  Contralto: '🎤',
  Tenor: '🎤',
  Solista: '🎤',
  Pianista: '🎹',
}

const BY_NAME: Array<[RegExp, string]> = [
  [/bateria|caj[oó]n|percuss/, '🥁'],
  [/teclad|piano|synth/, '🎹'],
  [/viol[aã]o|guitar|baixo/, '🎸'],
  [/vocal|ministro|soprano|contralto|tenor|solista|backing/, '🎤'],
  [/mesa|\\bsom\\b/, '🎚️'],
  [/proje/, '📽️'],
  [/c[aâ]mera/, '📷'],
  [/ilumina|\\bluz\\b/, '💡'],
  [/transmiss/, '📡'],
]

export function functionIcon(name: string) {
  if (ICONS[name]) {
    return ICONS[name]
  }
  const key = name.toLowerCase()
  return BY_NAME.find(([pattern]) => pattern.test(key))?.[1] ?? '🎵'
}

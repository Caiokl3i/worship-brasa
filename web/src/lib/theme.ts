export type ThemeChoice = 'light' | 'dark' | 'system'

export function readTheme(): ThemeChoice {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

export function applyTheme(choice: ThemeChoice) {
  document.documentElement.dataset.theme = choice
  localStorage.setItem('theme', choice)
}

import { useState } from 'react'
import { applyTheme, readTheme, type ThemeChoice } from '../lib/theme.ts'

export function ThemeSelect() {
  const [theme, setTheme] = useState<ThemeChoice>(readTheme)

  return (
    <select
      aria-label="Tema"
      value={theme}
      onChange={(event) => {
        const next = event.target.value as ThemeChoice
        setTheme(next)
        applyTheme(next)
      }}
    >
      <option value="system">Sistema</option>
      <option value="light">Claro</option>
      <option value="dark">Escuro</option>
    </select>
  )
}

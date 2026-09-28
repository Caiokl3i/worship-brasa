import { useEffect, useState } from 'react'
import { applyTheme, readTheme, type ThemeChoice } from '../lib/theme.ts'
import { Icon } from './Icon.tsx'

export function ThemeSelect() {
  const [theme, setTheme] = useState<ThemeChoice>(readTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  function toggle() {
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const next: ThemeChoice = isDark ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={toggle}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label="Alternar tema de cores"
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={18} />
    </button>
  )
}

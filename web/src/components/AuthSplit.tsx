import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark.tsx'
import { ThemeSelect } from './ThemeSelect.tsx'

export function AuthSplit({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-hero">
        <BrandMark large />
        <h1>Bem-vindo ao LouveApp</h1>
        <p>Grande é o Senhor e mui digno de ser louvado</p>
        <p className="verse">Salmos 145.3</p>
      </aside>
      <section className="auth-panel">
        <div className="auth-tools">
          <ThemeSelect />
        </div>
        <BrandMark />
        <p className="auth-name">LouveApp</p>
        {children}
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </section>
    </div>
  )
}

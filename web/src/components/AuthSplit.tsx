import type { ReactNode } from 'react'
import { BrandMark } from './BrandMark.tsx'
import { ThemeSelect } from './ThemeSelect.tsx'
import { Icon } from './Icon.tsx'

export function AuthSplit({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth-hero">
        <div className="auth-hero-top">
          <ThemeSelect />
        </div>
        <div className="auth-hero-center">
          <div className="auth-hero-illustration">
            <BrandMark large />
          </div>
          <h1 className="auth-hero-title">BEM-VINDO AO LOUVEAPP</h1>
          <p className="auth-hero-subtitle">Grande é o Senhor e mui digno de ser louvado</p>
          <p className="verse">Salmos 145:3</p>
        </div>
        <div className="auth-hero-carousel">
          <button type="button" className="carousel-nav-btn" aria-label="Anterior">
            <Icon name="chevron-right" size={16} className="rotate-180" />
          </button>
          <div className="carousel-dots">
            <span className="dot dot-active" />
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
          <button type="button" className="carousel-nav-btn" aria-label="Próximo">
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      </aside>
      <section className="auth-panel">
        <div className="auth-logo-header">
          <BrandMark />
          <h2 className="auth-name">LouveApp</h2>
        </div>
        <div className="auth-form-container">
          {children}
        </div>
        {footer ? <div className="auth-footer">{footer}</div> : null}
      </section>
    </div>
  )
}

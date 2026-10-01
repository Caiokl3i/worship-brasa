import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.ts'
import type { MinistryDetail, MinistryList } from '../lib/ministry.ts'
import type { NotificationList } from '../lib/notification.ts'
import { useSession } from '../session.tsx'
import { ThemeSelect } from '../components/ThemeSelect.tsx'
import { Icon } from '../components/Icon.tsx'
import { BrandMark } from '../components/BrandMark.tsx'

export function AppLayout() {
  const { user, setUser } = useSession()
  const navigate = useNavigate()
  const nested = useMatch('/m/:ministryId/*')
  const exact = useMatch('/m/:ministryId')
  const currentId = nested?.params.ministryId ?? exact?.params.ministryId ?? ''
  const [ministries, setMinistries] = useState<MinistryList['active']>([])
  const [ministry, setMinistry] = useState<MinistryDetail | null>(null)
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function refresh() {
      try {
        const body = await api<NotificationList>('/api/notificacoes')
        if (!cancelled) {
          setUnread(body.unreadCount)
        }
      } catch {
        if (!cancelled) {
          setUnread(0)
        }
      }
    }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 30_000)
    window.addEventListener('focus', refresh)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [currentId])

  useEffect(() => {
    void api<MinistryList>('/api/ministerios')
      .then((body) => setMinistries(body.active))
      .catch(() => setMinistries([]))
  }, [currentId])

  useEffect(() => {
    if (!currentId) {
      return
    }
    void api<MinistryDetail>(`/api/ministerios/${currentId}`)
      .then((body) => setMinistry(body))
      .catch(() => setMinistry(null))
  }, [currentId])

  async function logout() {
    await api('/api/sair', { method: 'POST' })
    setUser(null)
    navigate('/entrar', { replace: true })
  }

  const selected = ministry && ministry.id === currentId ? ministry : null
  const member = selected?.membership
  const manages = Boolean(member?.isAdmin || member?.canManageSchedules)
  const home = currentId ? `/m/${currentId}` : '/ministerios'

  function closeMenu() {
    setMenuOpen(false)
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('')
    : 'U'

  return (
    <div className={menuOpen ? 'shell side-open' : 'shell'}>
      <aside className="side">
        <Link to="/perfil" className="side-user" onClick={closeMenu}>
          <div className="side-user-avatar">{initials}</div>
          <div className="side-user-info">
            <strong>{user?.name || 'Usuário'}</strong>
            <span>{user?.email}</span>
          </div>
          <Icon name="chevron-right" size={16} className="side-user-chevron" />
        </Link>
        <nav className="side-nav">
          <NavLink to={home} end onClick={closeMenu} className="side-link">
            <Icon name="home" size={20} className="side-link-icon" />
            <span className="side-link-label">Início</span>
          </NavLink>
          {currentId ? (
            <>
              <NavLink to={`/m/${currentId}/escalas`} onClick={closeMenu} className="side-link">
                <Icon name="schedules" size={20} className="side-link-icon" />
                <span className="side-link-label">Escalas</span>
              </NavLink>
              {selected && !selected.musicModuleEnabled ? null : (
                <NavLink to={`/m/${currentId}/repertorio`} onClick={closeMenu} className="side-link">
                  <Icon name="repertoire" size={20} className="side-link-icon" />
                  <span className="side-link-label">Repertório</span>
                </NavLink>
              )}
              <NavLink to={`/m/${currentId}/chat`} onClick={closeMenu} className="side-link">
                <Icon name="posts" size={20} className="side-link-icon" />
                <span className="side-link-label">Mensagens</span>
              </NavLink>
              <NavLink to={`/m/${currentId}/membros`} onClick={closeMenu} className="side-link">
                <Icon name="ministry" size={20} className="side-link-icon" />
                <span className="side-link-label">Ministério</span>
              </NavLink>
              <div className="side-gap">
                <NavLink to={`/m/${currentId}/avisos`} onClick={closeMenu} className="side-link side-link-sub">
                  <Icon name="announcements" size={18} className="side-link-icon" />
                  <span className="side-link-label">Avisos</span>
                </NavLink>
                <NavLink to={`/m/${currentId}/indisponibilidades`} onClick={closeMenu} className="side-link side-link-sub">
                  <Icon name="unavailability" size={18} className="side-link-icon" />
                  <span className="side-link-label">Indisponibilidades</span>
                </NavLink>
                {manages ? (
                  <NavLink to={`/m/${currentId}/relatorios`} onClick={closeMenu} className="side-link side-link-sub">
                    <Icon name="reports" size={18} className="side-link-icon" />
                    <span className="side-link-label">Panorama de escalas</span>
                  </NavLink>
                ) : null}
                {manages ? (
                  <NavLink to={`/m/${currentId}/roteiros`} onClick={closeMenu} className="side-link side-link-sub">
                    <Icon name="scripts" size={18} className="side-link-icon" />
                    <span className="side-link-label">Modelos de roteiro</span>
                  </NavLink>
                ) : null}
                {member?.isAdmin ? (
                  <NavLink to={`/m/${currentId}/convite`} onClick={closeMenu} className="side-link side-link-sub">
                    <Icon name="invite" size={18} className="side-link-icon" />
                    <span className="side-link-label">Convidar membros</span>
                  </NavLink>
                ) : null}
                {member?.isAdmin ? (
                  <NavLink to={`/m/${currentId}/integracao`} onClick={closeMenu} className="side-link side-link-sub">
                    <Icon name="tokens" size={18} className="side-link-icon" />
                    <span className="side-link-label">Tokens de API</span>
                  </NavLink>
                ) : null}
                {member?.isAdmin || member?.canManageSchedules || member?.canManageRepertoire ? (
                  <NavLink to={`/m/${currentId}/lixeira`} onClick={closeMenu} className="side-link side-link-sub">
                    <Icon name="trash" size={18} className="side-link-icon" />
                    <span className="side-link-label">Lixeira</span>
                  </NavLink>
                ) : null}
              </div>
            </>
          ) : null}
        </nav>
        <div className="side-bottom">
          <NavLink to="/perfil" onClick={closeMenu} className="side-link side-link-bottom">
            <Icon name="settings" size={18} className="side-link-icon" />
            <span className="side-link-label">Configurações</span>
          </NavLink>
          <button type="button" className="side-logout-btn" onClick={() => void logout()}>
            <Icon name="logout" size={18} className="side-link-icon" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            aria-label="Abrir menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="menu-bar" />
            <span className="menu-bar" />
            <span className="menu-bar" />
          </button>
          <Link to={home} className="wordmark">
            <BrandMark />
            <span className="wordmark-text">LouveApp</span>
          </Link>
          <div className="topbar-tools">
            {ministries.length > 0 ? (
              <div className="topbar-select-wrapper">
                <select
                  aria-label="Ministério"
                  className="topbar-select"
                  value={ministries.some((item) => item.id === currentId) ? currentId : ''}
                  onChange={(event) => {
                    if (event.target.value) {
                      navigate(`/m/${event.target.value}`)
                    }
                  }}
                >
                  <option value="">Alternar Ministério</option>
                  {ministries.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <ThemeSelect />
            <Link to="/notificacoes" className="topbar-notify-btn" aria-label="Notificações">
              <Icon name="bell" size={19} />
              {unread > 0 ? <span className="topbar-badge">{unread}</span> : null}
            </Link>
          </div>
        </header>
        <main className="shell-main">
          <Outlet />
        </main>
      </div>
      {menuOpen ? (
        <button type="button" className="side-backdrop" aria-label="Fechar menu" onClick={closeMenu} />
      ) : null}
      {currentId ? (
        <nav className="tabbar">
          <NavLink to={home} end onClick={closeMenu} className="tab-item">
            <Icon name="home" size={20} />
            <span>Início</span>
          </NavLink>
          <NavLink to={`/m/${currentId}/escalas`} onClick={closeMenu} className="tab-item">
            <Icon name="schedules" size={20} />
            <span>Escalas</span>
          </NavLink>
          {selected && !selected.musicModuleEnabled ? null : (
            <NavLink to={`/m/${currentId}/repertorio`} onClick={closeMenu} className="tab-item">
              <Icon name="repertoire" size={20} />
              <span>Repertório</span>
            </NavLink>
          )}
          <NavLink to={`/m/${currentId}/chat`} onClick={closeMenu} className="tab-item">
            <Icon name="posts" size={20} />
            <span>Mensagens</span>
          </NavLink>
          <NavLink to={`/m/${currentId}/membros`} onClick={closeMenu} className="tab-item">
            <Icon name="ministry" size={20} />
            <span>Ministério</span>
          </NavLink>
        </nav>
      ) : null}
    </div>
  )
}

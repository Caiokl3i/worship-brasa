import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useMatch, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.ts'
import type { MinistryDetail, MinistryList } from '../lib/ministry.ts'
import type { NotificationList } from '../lib/notification.ts'
import { useSession } from '../session.tsx'
import { ThemeSelect } from '../components/ThemeSelect.tsx'

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

  return (
    <div className={menuOpen ? 'shell side-open' : 'shell'}>
      <aside className="side">
        <Link to="/perfil" className="side-user" onClick={closeMenu}>
          <strong>{user?.name}</strong>
          <span>{user?.email}</span>
        </Link>
        <nav>
          <NavLink to={home} end onClick={closeMenu}>
            Início
          </NavLink>
          {currentId ? (
            <>
              <NavLink to={`/m/${currentId}/escalas`} onClick={closeMenu}>
                Escalas
              </NavLink>
              {selected && !selected.musicModuleEnabled ? null : (
                <NavLink to={`/m/${currentId}/repertorio`} onClick={closeMenu}>
                  Repertório
                </NavLink>
              )}
              <NavLink to={`/m/${currentId}/chat`} onClick={closeMenu}>
                Mensagens
              </NavLink>
              <NavLink to={`/m/${currentId}/membros`} onClick={closeMenu}>
                Ministério
              </NavLink>
              <div className="side-gap">
                <NavLink to={`/m/${currentId}/avisos`} onClick={closeMenu}>
                  Avisos
                </NavLink>
                <NavLink to={`/m/${currentId}/indisponibilidades`} onClick={closeMenu}>
                  Indisponibilidades
                </NavLink>
                {manages ? (
                  <NavLink to={`/m/${currentId}/relatorios`} onClick={closeMenu}>
                    Panorama de escalas
                  </NavLink>
                ) : null}
                {manages ? (
                  <NavLink to={`/m/${currentId}/roteiros`} onClick={closeMenu}>
                    Modelos de roteiro
                  </NavLink>
                ) : null}
                {member?.isAdmin ? (
                  <NavLink to={`/m/${currentId}/convite`} onClick={closeMenu}>
                    Convidar membros
                  </NavLink>
                ) : null}
                {member?.isAdmin ? (
                  <NavLink to={`/m/${currentId}/integracao`} onClick={closeMenu}>
                    Tokens de API
                  </NavLink>
                ) : null}
                {member?.isAdmin || member?.canManageSchedules || member?.canManageRepertoire ? (
                  <NavLink to={`/m/${currentId}/lixeira`} onClick={closeMenu}>
                    Lixeira
                  </NavLink>
                ) : null}
              </div>
            </>
          ) : null}
        </nav>
        <nav className="side-bottom">
          <NavLink to="/perfil" onClick={closeMenu}>
            Configurações
          </NavLink>
          <button type="button" className="button-outline" onClick={() => void logout()}>
            Sair
          </button>
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Menu
          </button>
          <Link to={home} className="wordmark">
            LouveApp
          </Link>
          <div className="topbar-tools">
            {ministries.length > 0 ? (
              <select
                aria-label="Ministério"
                value={ministries.some((item) => item.id === currentId) ? currentId : ''}
                onChange={(event) => {
                  if (event.target.value) {
                    navigate(`/m/${event.target.value}`)
                  }
                }}
              >
                <option value="">Ministérios</option>
                {ministries.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            ) : null}
            <ThemeSelect />
            <Link to="/notificacoes">Notificações{unread > 0 ? ` (${unread})` : ''}</Link>
          </div>
        </header>
        <div className="shell-main">
          <Outlet />
        </div>
      </div>
      {currentId ? (
        <nav className="tabbar">
          <NavLink to={home} end onClick={closeMenu}>
            Início
          </NavLink>
          <NavLink to={`/m/${currentId}/escalas`} onClick={closeMenu}>
            Escalas
          </NavLink>
          {selected && !selected.musicModuleEnabled ? null : (
            <NavLink to={`/m/${currentId}/repertorio`} onClick={closeMenu}>
              Repertório
            </NavLink>
          )}
          <NavLink to={`/m/${currentId}/chat`} onClick={closeMenu}>
            Mensagens
          </NavLink>
          <NavLink to={`/m/${currentId}/membros`} onClick={closeMenu}>
            Ministério
          </NavLink>
        </nav>
      ) : null}
    </div>
  )
}

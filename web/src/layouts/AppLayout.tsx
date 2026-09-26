import { useEffect, useState } from 'react'
import { Link, Outlet, useMatch, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.ts'
import type { MinistryList } from '../lib/ministry.ts'
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
  const [unread, setUnread] = useState(0)

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

  async function logout() {
    await api('/api/sair', { method: 'POST' })
    setUser(null)
    navigate('/entrar', { replace: true })
  }

  return (
    <div className="page">
      <header className="topbar">
        <span>{user?.name}</span>
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
            {ministries.map((ministry) => (
              <option key={ministry.id} value={ministry.id}>
                {ministry.name}
              </option>
            ))}
          </select>
        ) : null}
        <ThemeSelect />
        <Link to="/notificacoes">Notificações{unread > 0 ? ` (${unread})` : ''}</Link>
        <button type="button" onClick={() => void logout()}>
          Sair
        </button>
      </header>
      <Outlet />
    </div>
  )
}

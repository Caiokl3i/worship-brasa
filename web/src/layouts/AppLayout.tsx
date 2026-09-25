import { useEffect, useState } from 'react'
import { Outlet, useMatch, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.ts'
import type { MinistryList } from '../lib/ministry.ts'
import { useSession } from '../session.tsx'

export function AppLayout() {
  const { user, setUser } = useSession()
  const navigate = useNavigate()
  const nested = useMatch('/m/:ministryId/*')
  const exact = useMatch('/m/:ministryId')
  const currentId = nested?.params.ministryId ?? exact?.params.ministryId ?? ''
  const [ministries, setMinistries] = useState<MinistryList['active']>([])

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
        <button type="button" onClick={() => void logout()}>
          Sair
        </button>
      </header>
      <Outlet />
    </div>
  )
}

import { Outlet, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.ts'
import { useSession } from '../session.tsx'

export function AppLayout() {
  const { user, setUser } = useSession()
  const navigate = useNavigate()

  async function logout() {
    await api('/api/sair', { method: 'POST' })
    setUser(null)
    navigate('/entrar', { replace: true })
  }

  return (
    <div className="page">
      <header className="topbar">
        <span>{user?.name}</span>
        <button type="button" onClick={() => void logout()}>
          Sair
        </button>
      </header>
      <Outlet />
    </div>
  )
}

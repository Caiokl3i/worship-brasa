import { Navigate, Outlet } from 'react-router-dom'
import { useSession } from './session.tsx'

export function RequireAuth() {
  const { status } = useSession()

  if (status === 'carregando') {
    return <p className="page">Carregando…</p>
  }

  if (status === 'anonimo') {
    return <Navigate to="/entrar" replace />
  }

  return <Outlet />
}

export function GuestOnly() {
  const { status } = useSession()

  if (status === 'carregando') {
    return <p className="page">Carregando…</p>
  }

  if (status === 'dentro') {
    return <Navigate to="/ministerios" replace />
  }

  return <Outlet />
}

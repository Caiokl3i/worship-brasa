import { Navigate } from 'react-router-dom'
import { useSession } from '../session.tsx'

export function HomeGate() {
  const { status } = useSession()

  if (status === 'carregando') {
    return <p className="page">Carregando…</p>
  }

  if (status === 'dentro') {
    return <Navigate to="/ministerios" replace />
  }

  return <Navigate to="/entrar" replace />
}

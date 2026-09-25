import { createContext, useContext, useEffect, useState } from 'react'
import { api, ApiError, type PublicUser } from './lib/api.ts'

type SessionStatus = 'carregando' | 'anonimo' | 'dentro'

type SessionValue = {
  status: SessionStatus
  user: PublicUser | null
  refresh: () => Promise<void>
  setUser: (user: PublicUser | null) => void
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('carregando')
  const [user, setUserState] = useState<PublicUser | null>(null)

  async function refresh() {
    try {
      const me = await api<PublicUser>('/api/eu')
      setUserState(me)
      setStatus('dentro')
    } catch (error) {
      setUserState(null)
      setStatus('anonimo')
      if (error instanceof ApiError && error.status !== 401) {
        throw error
      }
    }
  }

  function setUser(next: PublicUser | null) {
    setUserState(next)
    setStatus(next ? 'dentro' : 'anonimo')
  }

  useEffect(() => {
    // Pergunta uma vez, ao abrir. O cookie, se existir, responde.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    void refresh()
  }, [])

  return (
    <SessionContext.Provider value={{ status, user, refresh, setUser }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const value = useContext(SessionContext)
  if (!value) {
    throw new Error('useSession precisa ficar dentro de SessionProvider')
  }
  return value
}

import { createContext, useContext, useEffect, useState } from 'react'
import { Link, Outlet, useParams } from 'react-router-dom'
import { api, ApiError } from '../lib/api.ts'
import type { MinistryDetail } from '../lib/ministry.ts'

type MinistryValue = {
  ministry: MinistryDetail
  reload: () => Promise<void>
}

const MinistryContext = createContext<MinistryValue | null>(null)

export function useMinistry() {
  const value = useContext(MinistryContext)
  if (!value) {
    throw new Error('useMinistry precisa ficar dentro do ministério')
  }
  return value
}

export function MinistryLayout() {
  const params = useParams()
  const ministryId = params.ministryId ?? ''
  const [ministry, setMinistry] = useState<MinistryDetail | null>(null)
  const [missing, setMissing] = useState(false)

  async function reload() {
    try {
      const body = await api<MinistryDetail>(`/api/ministerios/${ministryId}`)
      setMinistry(body)
      setMissing(false)
    } catch (error) {
      setMinistry(null)
      if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
        setMissing(true)
        return
      }
      throw error
    }
  }

  useEffect(() => {
    void reload()
  }, [ministryId])

  if (missing) {
    return (
      <section>
        <h1>Ministério não encontrado.</h1>
        <p>
          <Link to="/ministerios">Voltar</Link>
        </p>
      </section>
    )
  }

  if (!ministry) {
    return <p>Carregando…</p>
  }

  return (
    <MinistryContext.Provider value={{ ministry, reload }}>
      <Outlet />
    </MinistryContext.Provider>
  )
}

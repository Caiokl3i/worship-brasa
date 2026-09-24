import { useEffect, useState } from 'react'
import { getHealth } from '../lib/api.ts'

type ApiStatus = 'carregando' | 'ok' | 'erro'

export function HomePage() {
  const [status, setStatus] = useState<ApiStatus>('carregando')
  const [timezone, setTimezone] = useState('')

  useEffect(() => {
    getHealth()
      .then((health) => {
        setStatus('ok')
        setTimezone(health.timezone)
      })
      .catch(() => {
        setStatus('erro')
      })
  }, [])

  return (
    <main className="page">
      <p className="eyebrow">Etapa 0</p>
      <h1>Worship Brasa</h1>
      <p>A fundação do sistema está no ar.</p>
      <p>
        API: <strong>{status}</strong>
        {timezone ? ` · fuso padrão ${timezone}` : null}
      </p>
    </main>
  )
}


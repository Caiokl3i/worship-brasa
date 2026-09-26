import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api.ts'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

type TokenInfo = {
  prefix: string
  createdAt: string
  revokedAt: string | null
  lastUsedAt: string | null
}

export function IntegracaoPage() {
  const { ministry } = useMinistry()
  const [token, setToken] = useState<TokenInfo | null>(null)
  const [plain, setPlain] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const body = await api<{ token: TokenInfo | null }>(
      `/api/ministerios/${ministry.id}/integracao`
    )
    setToken(body.token)
  }

  useEffect(() => {
    if (!ministry.membership.isAdmin) {
      return
    }
    let cancelled = false
    api<{ token: TokenInfo | null }>(`/api/ministerios/${ministry.id}/integracao`)
      .then((body) => {
        if (!cancelled) {
          setToken(body.token)
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled && caught instanceof ApiError) {
          setError(caught.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [ministry.id, ministry.membership.isAdmin])

  async function generate() {
    setError('')
    const body = await api<{ token: string; prefix: string }>(
      `/api/ministerios/${ministry.id}/integracao`,
      { method: 'POST' }
    )
    setPlain(body.token)
    setNotice('Copie o token agora. Ele não aparece de novo.')
    await load()
  }

  async function revoke() {
    setError('')
    setPlain('')
    await api(`/api/ministerios/${ministry.id}/integracao`, { method: 'DELETE' })
    setNotice('Token revogado.')
    await load()
  }

  if (!ministry.membership.isAdmin) {
    return (
      <section>
        <h1>Integrações</h1>
        <p>Você não pode fazer isso.</p>
        <p>
          <Link to="..">Voltar</Link>
        </p>
      </section>
    )
  }

  return (
    <section>
      <p className="eyebrow">Integrações</p>
      <h1>{ministry.name}</h1>
      {error ? <p className="errors">{error}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}
      {plain ? (
        <p className="card">
          <strong>{plain}</strong>
        </p>
      ) : null}
      {token ? (
        <div className="card">
          <span>Prefixo {token.prefix}</span>
          {token.revokedAt ? <span>Revogado</span> : <span>Ativo</span>}
          {token.revokedAt ? null : (
            <button type="button" onClick={() => void revoke()}>
              Revogar
            </button>
          )}
        </div>
      ) : (
        <p>Nenhum token ainda.</p>
      )}
      <button type="button" onClick={() => void generate()}>
        {token && !token.revokedAt ? 'Gerar outro' : 'Gerar token'}
      </button>
      <p>
        <Link to="..">Voltar</Link>
      </p>
    </section>
  )
}

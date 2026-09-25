import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api.ts'
import type { InviteInfo } from '../lib/ministry.ts'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

type RequestItem = {
  membershipId: string
  name: string
  email: string
}

export function ConviteAdminPage() {
  const { ministry } = useMinistry()
  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const [inviteBody, requestBody] = await Promise.all([
      api<{ invite: InviteInfo | null }>(`/api/ministerios/${ministry.id}/convite`),
      api<{ requests: RequestItem[] }>(`/api/ministerios/${ministry.id}/pedidos`),
    ])
    setInvite(inviteBody.invite)
    setRequests(requestBody.requests)
  }

  useEffect(() => {
    if (!ministry.membership.isAdmin) {
      return
    }
    void load().catch((caught: unknown) => {
      if (caught instanceof ApiError) {
        setError(caught.message)
      }
    })
  }, [ministry.id, ministry.membership.isAdmin])

  async function generate() {
    setError('')
    const body = await api<{ invite: InviteInfo }>(`/api/ministerios/${ministry.id}/convite`, {
      method: 'POST',
    })
    setInvite(body.invite)
    setNotice('Código novo gerado. O anterior deixou de valer.')
  }

  async function copy() {
    if (!invite) {
      return
    }
    await navigator.clipboard.writeText(`${window.location.origin}${invite.path}`)
    setNotice('Link copiado.')
  }

  async function decide(membershipId: string, action: 'aprovar' | 'rejeitar') {
    await api(`/api/ministerios/${ministry.id}/pedidos/${membershipId}/${action}`, {
      method: 'POST',
    })
    await load()
  }

  if (!ministry.membership.isAdmin) {
    return (
      <section>
        <h1>Convite</h1>
        <p>Você não pode fazer isso.</p>
        <p>
          <Link to="..">Voltar</Link>
        </p>
      </section>
    )
  }

  return (
    <section>
      <p className="eyebrow">Convite</p>
      <h1>{ministry.name}</h1>
      {error ? <p className="errors">{error}</p> : null}
      {notice ? <p className="notice">{notice}</p> : null}
      {invite ? (
        <div className="card">
          <strong>{invite.code}</strong>
          <span>{`${window.location.origin}${invite.path}`}</span>
          {invite.expired ? <span>Este código venceu.</span> : null}
          <div className="row">
            <button type="button" onClick={() => void copy()}>
              Copiar link
            </button>
            <button type="button" onClick={() => void generate()}>
              Gerar outro
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => void generate()}>
          Gerar código
        </button>
      )}

      <h2>Pedidos</h2>
      {requests.length === 0 ? <p>Nenhum pedido pendente.</p> : null}
      <ul className="list">
        {requests.map((request) => (
          <li key={request.membershipId} className="card">
            <strong>{request.name}</strong>
            <span>{request.email}</span>
            <div className="row">
              <button type="button" onClick={() => void decide(request.membershipId, 'aprovar')}>
                Aprovar
              </button>
              <button type="button" onClick={() => void decide(request.membershipId, 'rejeitar')}>
                Rejeitar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p>
        <Link to="..">Voltar</Link>
      </p>
    </section>
  )
}

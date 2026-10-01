import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TextField } from '../components/TextField.tsx'
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
  const [inviteEmail, setInviteEmail] = useState('')

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

  async function sendEmail(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      const body = await api<{ sent: 'code' | 'activation' }>(
        `/api/ministerios/${ministry.id}/convite/email`,
        { method: 'POST', body: JSON.stringify({ email: inviteEmail }) }
      )
      setNotice(
        body.sent === 'code'
          ? 'Enviamos o código para esta conta.'
          : 'Enviamos um link para criar a senha.'
      )
      setInviteEmail('')
    } catch (caught: unknown) {
      if (caught instanceof ApiError) {
        setError(caught.message)
      }
    }
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
      <section className="page">
        <h1>Convite</h1>
        <p className="empty-state-card">Você não pode fazer isso.</p>
        <p className="row">
          <Link to="..">Voltar</Link>
        </p>
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{ministry.name}</p>
        <h1>Convidar membros</h1>
      </header>
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

      <form className="form" onSubmit={(event) => void sendEmail(event)}>
        <h2>Enviar por e-mail</h2>
        <TextField
          label="E-mail"
          name="inviteEmail"
          type="email"
          value={inviteEmail}
          onChange={setInviteEmail}
        />
        <button type="submit">Enviar convite</button>
      </form>

      <h2>Pedidos</h2>
      {requests.length === 0 ? <p>Nenhum pedido pendente.</p> : null}
      <ul className="list">
        {requests.map((request) => (
          <li key={request.membershipId} className="card">
            <strong>{request.name}</strong>
            <span>{request.email}</span>
            <div className="row">
              <button type="button" className="button-primary" onClick={() => void decide(request.membershipId, 'aprovar')}>
                Aprovar
              </button>
              <button type="button" className="button-danger-outline" onClick={() => void decide(request.membershipId, 'rejeitar')}>
                Rejeitar
              </button>
            </div>
          </li>
        ))}
      </ul>
      <p className="row">
        <Link to="..">Voltar</Link>
      </p>
    </section>
  )
}

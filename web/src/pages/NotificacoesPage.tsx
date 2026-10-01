import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api.ts'
import type { NotificationItem, NotificationList } from '../lib/notification.ts'

function when(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function NotificacoesPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    void api<NotificationList>('/api/notificacoes')
      .then((body) => {
        if (!cancelled) {
          setItems(body.notifications)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNotice('Não foi possível carregar as notificações.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function open(item: NotificationItem) {
    if (!item.readAt) {
      await api(`/api/notificacoes/${item.id}/lida`, { method: 'POST' })
    }
    navigate(item.link)
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Conta</p>
        <h1>Notificações</h1>
      </header>
      <p className="row">
        <Link to="/notificacoes/preferencias">Preferências</Link>
        <Link to="/ministerios">Voltar</Link>
      </p>
      {notice ? <p className="errors">{notice}</p> : null}
      {items.length === 0 && !notice ? (
        <p className="empty-state-card">Nenhuma notificação.</p>
      ) : null}
      <div className="list">
        {items.map((item) => (
          <article key={item.id} className="card">
            <button type="button" className="linkish" onClick={() => void open(item)}>
              {item.readAt ? item.title : <strong>{item.title}</strong>}
            </button>
            <p>{item.body}</p>
            <p>
              {when(item.createdAt)}
              {item.readAt ? '' : <span className="unread-dot"> · Não lida</span>}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../lib/api.ts'
import type { NotificationPreference, NotificationPreferences } from '../lib/notification.ts'

const groups = [
  { id: 'escala', title: 'Escala' },
  { id: 'ministerio', title: 'Ministério' },
] as const

export function PreferenciasNotificacaoPage() {
  const [items, setItems] = useState<NotificationPreference[]>([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void api<NotificationPreferences>('/api/notificacoes/preferencias')
      .then((body) => {
        if (!cancelled) {
          setItems(body.preferences)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Não foi possível carregar as preferências.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  function toggle(type: string, field: 'inApp' | 'email') {
    setItems((current) =>
      current.map((item) => (item.type === type ? { ...item, [field]: !item[field] } : item))
    )
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setNotice('')
    setError('')
    try {
      const body = await api<NotificationPreferences>('/api/notificacoes/preferencias', {
        method: 'PUT',
        body: JSON.stringify({
          preferences: items.map((item) => ({
            type: item.type,
            inApp: item.inApp,
            email: item.email,
          })),
        }),
      })
      setItems(body.preferences)
      setNotice('Preferências salvas.')
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.errors[0]?.message ?? 'Não foi possível salvar.')
        return
      }
      throw caught
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Conta</p>
        <h1>Preferências de notificação</h1>
      </header>
      <p className="row">
        <Link to="/notificacoes">Voltar</Link>
      </p>
      {error ? <p className="errors">{error}</p> : null}
      {notice ? <p className="notice-success">{notice}</p> : null}
      <form onSubmit={(event) => void save(event)} className="form">
        {groups.map((group) => (
          <fieldset key={group.id}>
            <legend>{group.title}</legend>
            {items
              .filter((item) => item.group === group.id)
              .map((item) => (
                <div key={item.type} className="checks">
                  <strong>{item.label}</strong>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.inApp}
                      onChange={() => toggle(item.type, 'inApp')}
                    />{' '}
                    No sistema
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      name={item.type}
                      checked={item.email}
                      onChange={() => toggle(item.type, 'email')}
                    />{' '}
                    E-mail
                  </label>
                </div>
              ))}
          </fieldset>
        ))}
        <button type="submit">Salvar</button>
      </form>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { formatNoticeDate, type NoticeItem, type NoticeLists } from '../lib/notice.ts'

export function AvisosPage() {
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const [lists, setLists] = useState<NoticeLists>({ notices: [], pinned: [], archived: [] })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [expiresAt, setExpiresAt] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')

  async function load() {
    const next = await api<NoticeLists>(`/api/ministerios/${ministry.id}/avisos`)
    setLists(next)
    return next
  }

  useEffect(() => {
    let cancelled = false
    void api<NoticeLists>(`/api/ministerios/${ministry.id}/avisos`)
      .then((next) => {
        if (!cancelled) {
          setLists(next)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled && error instanceof ApiError) {
          setNotice(error.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [ministry.id])

  function fill(item: NoticeItem) {
    setSelectedId(item.id)
    setTitle(item.title)
    setBody(item.body)
    setPinned(item.pinned)
    setExpiresAt(item.expiresAt ?? '')
    setErrors([])
    setNotice('')
  }

  function startNew() {
    setSelectedId(null)
    setTitle('')
    setBody('')
    setPinned(false)
    setExpiresAt('')
    setErrors([])
    setNotice('')
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice('')
    const payload = JSON.stringify({
      title,
      body,
      pinned,
      expiresAt: expiresAt || null,
    })
    try {
      if (selectedId) {
        await api(`/api/ministerios/${ministry.id}/avisos/${selectedId}`, {
          method: 'PATCH',
          body: payload,
        })
      } else {
        await api(`/api/ministerios/${ministry.id}/avisos`, { method: 'POST', body: payload })
      }
      await load()
      startNew()
      setNotice('Aviso salvo.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  async function archive(id: string) {
    setErrors([])
    setNotice('')
    await api(`/api/ministerios/${ministry.id}/avisos/${id}/arquivar`, { method: 'POST' })
    if (selectedId === id) {
      startNew()
    }
    await load()
    setNotice('Aviso arquivado.')
  }

  async function unarchive(id: string) {
    setErrors([])
    setNotice('')
    await api(`/api/ministerios/${ministry.id}/avisos/${id}/desarquivar`, { method: 'POST' })
    await load()
    setNotice('Aviso desarquivado.')
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">Ministério</p>
        <h1>Avisos</h1>
      </header>
      <p className="row">
        <Link to={`/m/${ministry.id}`}>Voltar</Link>
        {canManage ? (
          <button type="button" onClick={startNew}>
            Novo aviso
          </button>
        ) : null}
      </p>
      {notice ? <p className="notice">{notice}</p> : null}
      <ul className="list">
        {lists.notices.map((item) => (
          <li key={item.id} className="card">
            <strong>{item.title}</strong>
            {item.pinned ? <span className="badge">Destaque</span> : null}
            <p>{item.body}</p>
            <p>
              {item.author.name}
              {item.expiresAt ? ` — até ${formatNoticeDate(item.expiresAt)}` : ''}
            </p>
            {canManage ? (
              <div className="row">
                <button type="button" onClick={() => fill(item)}>
                  Editar
                </button>
                <button type="button" onClick={() => void archive(item.id)}>
                  Arquivar
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {lists.notices.length === 0 ? <p className="empty-state-card">Nenhum aviso no momento.</p> : null}

      {canManage ? (
        <form className="form" onSubmit={(event) => void save(event)}>
          <h2>{selectedId ? 'Editar aviso' : 'Novo aviso'}</h2>
          <FieldErrors errors={errors} />
          <TextField
            label="Título"
            name="title"
            value={title}
            message={fieldMessage(errors, 'title')}
            onChange={setTitle}
          />
          <label className="field">
            <span>Texto</span>
            <textarea name="body" value={body} onChange={(event) => setBody(event.target.value)} />
            {fieldMessage(errors, 'body') ? <small>{fieldMessage(errors, 'body')}</small> : null}
          </label>
          <label>
            <input
              name="pinned"
              type="checkbox"
              checked={pinned}
              onChange={(event) => setPinned(event.target.checked)}
            />{' '}
            Destaque na início
          </label>
          <TextField
            label="Vencimento"
            name="expiresAt"
            type="date"
            value={expiresAt}
            message={fieldMessage(errors, 'expiresAt')}
            onChange={setExpiresAt}
          />
          <button type="submit">Salvar aviso</button>
        </form>
      ) : null}

      {canManage ? (
        <div>
          <h2>Arquivados</h2>
          <ul className="list">
            {lists.archived.map((item) => (
              <li key={item.id} className="card">
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <button type="button" onClick={() => void unarchive(item.id)}>
                  Desarquivar
                </button>
              </li>
            ))}
          </ul>
          {lists.archived.length === 0 ? (
            <p className="empty-state-card">Nenhum aviso arquivado.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

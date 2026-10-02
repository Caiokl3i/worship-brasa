import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { Icon } from '../components/Icon.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { MinistryDetail, MinistryList } from '../lib/ministry.ts'
import type { NoticeItem, NoticeLists } from '../lib/notice.ts'

const TITLE_LIMIT = 40
const BODY_LIMIT = 1000

type MinistryTarget = {
  id: string
  name: string
  color: string
}

function formatCreated(iso: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(iso))
}

export function AvisosPage() {
  const navigate = useNavigate()
  const { ministry } = useMinistry()
  const [params, setParams] = useSearchParams()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const [lists, setLists] = useState<NoticeLists>({ notices: [], pinned: [], archived: [] })
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [pinned, setPinned] = useState(false)
  const [notify, setNotify] = useState(true)
  const [expiresAt, setExpiresAt] = useState('')
  const [targets, setTargets] = useState<MinistryTarget[]>([])
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const editingId = params.get('editar')
  const detailId = params.get('aviso')
  const creating = params.get('novo') === '1'
  const showingArchived = params.get('arquivados') === '1'
  const screen = creating || editingId ? 'form' : detailId ? 'detail' : showingArchived ? 'archived' : 'list'
  const current = [...lists.notices, ...lists.archived].find(
    (item) => item.id === (detailId || editingId)
  )

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
          setLoaded(true)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled && error instanceof ApiError) {
          setMessage(error.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [ministry.id])

  useEffect(() => {
    if (loaded && (detailId || editingId) && !current) {
      setParams({})
    }
  }, [loaded, detailId, editingId, current, setParams])

  useEffect(() => {
    if (!creating) {
      return
    }
    let cancelled = false
    void api<MinistryList>('/api/ministerios')
      .then(async (list) => {
        const manageable: MinistryTarget[] = []
        for (const item of list.active) {
          const detail = await api<MinistryDetail>(`/api/ministerios/${item.id}`)
          if (detail.membership.isAdmin || detail.membership.canManageSchedules) {
            manageable.push({ id: detail.id, name: detail.name, color: detail.color })
          }
        }
        if (!cancelled) {
          setTargets(manageable)
          setSelectedMinistries(
            manageable.some((item) => item.id === ministry.id)
              ? [ministry.id]
              : manageable.map((item) => item.id)
          )
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTargets([{ id: ministry.id, name: ministry.name, color: ministry.color }])
          setSelectedMinistries([ministry.id])
        }
      })
    return () => {
      cancelled = true
    }
  }, [creating, ministry.id, ministry.name, ministry.color])

  useEffect(() => {
    if (!editingId || !current) {
      return
    }
    setTitle(current.title)
    setBody(current.body)
    setPinned(current.pinned)
    setExpiresAt(current.expiresAt ?? '')
    setNotify(false)
    setErrors([])
    setMessage('')
  }, [editingId, current?.id])

  function openList() {
    setParams({})
    setMessage('')
    setErrors([])
  }

  function openCreate() {
    setTitle('')
    setBody('')
    setPinned(false)
    setNotify(true)
    setExpiresAt('')
    setErrors([])
    setMessage('')
    setParams({ novo: '1' })
  }

  function openDetail(id: string) {
    setParams({ aviso: id })
    setMessage('')
  }

  function openEdit(item: NoticeItem) {
    setTitle(item.title)
    setBody(item.body)
    setPinned(item.pinned)
    setExpiresAt(item.expiresAt ?? '')
    setNotify(false)
    setErrors([])
    setMessage('')
    setParams({ editar: item.id })
  }

  function toggleMinistry(id: string) {
    setSelectedMinistries((currentIds) =>
      currentIds.includes(id) ? currentIds.filter((item) => item !== id) : [...currentIds, id]
    )
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setMessage('')
    if (creating && selectedMinistries.length === 0) {
      setMessage('Selecione um ministério.')
      return
    }
    const payload = JSON.stringify({
      title,
      body,
      pinned,
      notify,
      expiresAt: expiresAt || null,
    })
    setSaving(true)
    try {
      if (editingId) {
        await api(`/api/ministerios/${ministry.id}/avisos/${editingId}`, {
          method: 'PATCH',
          body: payload,
        })
      } else {
        await Promise.all(
          selectedMinistries.map((ministryId) =>
            api(`/api/ministerios/${ministryId}/avisos`, { method: 'POST', body: payload })
          )
        )
      }
      await load()
      openList()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setMessage(error.message)
        return
      }
      throw error
    } finally {
      setSaving(false)
    }
  }

  async function archive(id: string) {
    await api(`/api/ministerios/${ministry.id}/avisos/${id}/arquivar`, { method: 'POST' })
    await load()
    openList()
  }

  async function unarchive(id: string) {
    await api(`/api/ministerios/${ministry.id}/avisos/${id}/desarquivar`, { method: 'POST' })
    await load()
  }

  const titleLimit = title.length > TITLE_LIMIT ? 160 : TITLE_LIMIT
  const bodyLimit = body.length > BODY_LIMIT ? 4000 : BODY_LIMIT

  return (
    <section className="page notice-screen">
      {screen === 'list' ? (
        <>
          <header className="notice-top">
            <button type="button" className="notice-icon-button" aria-label="Voltar" onClick={() => navigate(`/m/${ministry.id}`)}>
              <Icon name="chevron-right" size={20} className="notice-back-icon" />
            </button>
            <div className="notice-top-title">
              <h1>Avisos</h1>
              <p>{ministry.name}</p>
            </div>
            {canManage ? (
              <button
                type="button"
                className="notice-icon-button"
                aria-label="Avisos arquivados"
                onClick={() => setParams({ arquivados: '1' })}
              >
                <Icon name="archive" size={18} />
              </button>
            ) : (
              <span />
            )}
          </header>
          {message ? <p className="notice">{message}</p> : null}
          {lists.notices.length === 0 ? (
            <div className="empty-state-card">
              <Icon name="megaphone" size={20} className="empty-icon" />
              <span>Nenhum aviso no momento.</span>
            </div>
          ) : (
            <ul className="notice-list">
              {lists.notices.map((item) => (
                <li key={item.id}>
                  <button type="button" className="notice-row" onClick={() => openDetail(item.id)}>
                    <span className="notice-row-icon" aria-hidden="true">
                      <Icon name="megaphone" size={18} />
                    </span>
                    <span className="notice-row-copy">
                      <strong>{item.title}</strong>
                      <Icon name="info" size={14} className="notice-row-info" />
                    </span>
                    <Icon name="chevron-right" size={18} className="notice-row-chevron" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {canManage ? (
            <button type="button" className="notice-add" onClick={openCreate}>
              <Icon name="plus" size={16} /> Adicionar
            </button>
          ) : null}
        </>
      ) : null}

      {screen === 'detail' && current ? (
        <>
          <header className="notice-top">
            <button type="button" className="notice-icon-button" aria-label="Voltar" onClick={openList}>
              <Icon name="chevron-right" size={20} className="notice-back-icon" />
            </button>
            <span />
            <span />
          </header>
          <div className="notice-detail">
            <span className="notice-detail-icon" aria-hidden="true">
              <Icon name="megaphone" size={28} />
            </span>
            <h1>{current.title}</h1>
            <article className="notice-panel">
              <h2>Descrição</h2>
              <p>{current.body}</p>
            </article>
            <article className="notice-panel">
              <h2>Informações</h2>
              <p>Criado em {formatCreated(current.createdAt)}</p>
              <p className="notice-author">
                <Icon name="info" size={16} />
                {current.author.name}
              </p>
            </article>
            {canManage ? (
              <div className="notice-detail-actions">
                <button type="button" className="button-outline" onClick={() => openEdit(current)}>
                  Editar
                </button>
                <button type="button" className="button-outline" onClick={() => void archive(current.id)}>
                  Arquivar
                </button>
              </div>
            ) : null}
          </div>
        </>
      ) : null}

      {screen === 'archived' ? (
        <>
          <header className="notice-top">
            <button type="button" className="notice-icon-button" aria-label="Voltar" onClick={openList}>
              <Icon name="chevron-right" size={20} className="notice-back-icon" />
            </button>
            <div className="notice-top-title">
              <h1>Arquivados</h1>
              <p>{ministry.name}</p>
            </div>
            <span />
          </header>
          {lists.archived.length === 0 ? (
            <div className="empty-state-card">
              <Icon name="archive" size={20} className="empty-icon" />
              <span>Nenhum aviso arquivado.</span>
            </div>
          ) : (
            <ul className="notice-list">
              {lists.archived.map((item) => (
                <li key={item.id} className="notice-archived-row">
                  <button type="button" className="notice-row" onClick={() => openDetail(item.id)}>
                    <span className="notice-row-icon" aria-hidden="true">
                      <Icon name="megaphone" size={18} />
                    </span>
                    <span className="notice-row-copy">
                      <strong>{item.title}</strong>
                    </span>
                    <Icon name="chevron-right" size={18} className="notice-row-chevron" />
                  </button>
                  <button type="button" className="button-outline button-small" onClick={() => void unarchive(item.id)}>
                    Desarquivar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {screen === 'form' ? (
        <>
          <header className="notice-top">
            <button type="button" className="notice-icon-button" aria-label="Fechar" onClick={openList}>
              <Icon name="x" size={20} />
            </button>
            <div className="notice-top-title">
              <h1>{editingId ? 'Editar aviso' : 'Novo aviso'}</h1>
            </div>
            <span />
          </header>
          <form className="notice-form" onSubmit={(event) => void save(event)}>
            <FieldErrors errors={errors} />
            {message ? <p className="notice">{message}</p> : null}
            <label className="notice-field">
              <input
                name="title"
                value={title}
                maxLength={titleLimit}
                placeholder="Título *"
                aria-label="Título"
                onChange={(event) => setTitle(event.target.value)}
              />
              <span className={title.length > TITLE_LIMIT ? 'is-over' : undefined}>
                {title.length}/{TITLE_LIMIT}
              </span>
            </label>
            {fieldMessage(errors, 'title') ? <small className="field-error-msg">{fieldMessage(errors, 'title')}</small> : null}
            <label className="notice-field">
              <textarea
                name="body"
                value={body}
                maxLength={bodyLimit}
                placeholder="Descrição *"
                aria-label="Descrição"
                onChange={(event) => setBody(event.target.value)}
              />
              <span className={body.length > BODY_LIMIT ? 'is-over' : undefined}>
                {body.length}/{BODY_LIMIT}
              </span>
            </label>
            {fieldMessage(errors, 'body') ? <small className="field-error-msg">{fieldMessage(errors, 'body')}</small> : null}
            <label className={`notice-date${expiresAt ? ' has-value' : ''}`}>
              <Icon name="calendar" size={16} />
              <input
                type="date"
                name="expiresAt"
                value={expiresAt}
                aria-label="Data de vencimento"
                onChange={(event) => setExpiresAt(event.target.value)}
              />
              {expiresAt ? null : <span>Data de vencimento (Opcional)</span>}
            </label>
            {fieldMessage(errors, 'expiresAt') ? (
              <small className="field-error-msg">{fieldMessage(errors, 'expiresAt')}</small>
            ) : (
              <p className="notice-hint">Este aviso será arquivado automaticamente nessa data</p>
            )}

            <div className="notice-toggle">
              <span className="notice-toggle-icon" aria-hidden="true">
                <Icon name="megaphone" size={16} />
              </span>
              <span>
                <strong>Em destaque</strong>
                <span>Será exibido na tela início do aplicativo</span>
              </span>
              <button
                type="button"
                className="setup-switch"
                role="switch"
                aria-checked={pinned}
                aria-label="Em destaque"
                onClick={() => setPinned((value) => !value)}
              />
            </div>
            <div className="notice-toggle">
              <span className="notice-toggle-icon" aria-hidden="true">
                <Icon name="bell" size={16} />
              </span>
              <span>
                <strong>Notificar</strong>
                <span>Enviar notificação para os membros ao salvar</span>
              </span>
              <button
                type="button"
                className="setup-switch"
                role="switch"
                aria-checked={notify}
                aria-label="Notificar"
                onClick={() => setNotify((value) => !value)}
              />
            </div>

            {creating ? (
              <div className="notice-ministries">
                <div className="notice-ministries-head">
                  <h2>
                    Ministérios <span className="setup-count">{selectedMinistries.length}/{targets.length}</span>
                  </h2>
                  <button type="button" className="notice-clear" onClick={() => setSelectedMinistries([])}>
                    Limpar
                  </button>
                </div>
                <ul>
                  {targets.map((item) => (
                    <li key={item.id}>
                      <span className="notice-ministry-swatch" style={{ background: item.color }} aria-hidden="true" />
                      <span>{item.name}</span>
                      <input
                        type="checkbox"
                        checked={selectedMinistries.includes(item.id)}
                        aria-label={item.name}
                        onChange={() => toggleMinistry(item.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button type="submit" className="notice-save" disabled={saving}>
              <Icon name="check" size={16} /> {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </form>
        </>
      ) : null}
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { ScriptTemplateView } from '../lib/schedule.ts'

type DraftItem = {
  key: string
  title: string
  notes: string
  durationSeconds: string
}

function blankItem(): DraftItem {
  return { key: crypto.randomUUID(), title: '', notes: '', durationSeconds: '' }
}

function fromTemplate(template: ScriptTemplateView): DraftItem[] {
  return template.items.map((item) => ({
    key: item.id,
    title: item.title,
    notes: item.notes,
    durationSeconds: item.durationSeconds === null ? '' : String(item.durationSeconds),
  }))
}

export function RoteirosPage() {
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const [templates, setTemplates] = useState<ScriptTemplateView[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [items, setItems] = useState<DraftItem[]>([blankItem()])
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')

  async function load() {
    const body = await api<{ templates: ScriptTemplateView[] }>(
      `/api/ministerios/${ministry.id}/roteiros`
    )
    setTemplates(body.templates)
    return body.templates
  }

  useEffect(() => {
    if (!canManage) {
      return
    }
    let cancelled = false
    void api<{ templates: ScriptTemplateView[] }>(`/api/ministerios/${ministry.id}/roteiros`)
      .then((body) => {
        if (!cancelled) {
          setTemplates(body.templates)
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
  }, [ministry.id, canManage])

  function select(template: ScriptTemplateView) {
    setSelectedId(template.id)
    setName(template.name)
    setItems(fromTemplate(template))
    setErrors([])
    setNotice('')
  }

  function startNew() {
    setSelectedId(null)
    setName('')
    setItems([blankItem()])
    setErrors([])
    setNotice('')
  }

  function payloadItems() {
    return items.map((item) => ({
      title: item.title,
      notes: item.notes,
      durationSeconds: item.durationSeconds.trim() === '' ? null : Number(item.durationSeconds),
    }))
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice('')
    try {
      const body = JSON.stringify({ name, items: payloadItems() })
      const saved = selectedId
        ? await api<ScriptTemplateView>(`/api/ministerios/${ministry.id}/roteiros/${selectedId}`, {
            method: 'PATCH',
            body,
          })
        : await api<ScriptTemplateView>(`/api/ministerios/${ministry.id}/roteiros`, {
            method: 'POST',
            body,
          })
      await load()
      select(saved)
      setNotice('Modelo salvo.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  if (!canManage) {
    return (
      <section className="page">
        <h1>Roteiros</h1>
        <p className="empty-state-card">Você não pode fazer isso.</p>
        <p className="row">
          <Link to={`/m/${ministry.id}`}>Voltar</Link>
        </p>
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <p className="eyebrow">{ministry.name}</p>
        <h1>Modelos de roteiro</h1>
      </header>
      <p className="row">
        <Link to={`/m/${ministry.id}`}>Voltar</Link>
        <button type="button" onClick={startNew}>
          Novo modelo
        </button>
      </p>
      {notice ? <p className="notice">{notice}</p> : null}
      <ul className="list">
        {templates.map((template) => (
          <li key={template.id} className="card">
            <button type="button" onClick={() => select(template)}>
              {template.name}
            </button>
          </li>
        ))}
      </ul>
      <form className="form" onSubmit={(event) => void save(event)}>
        <FieldErrors errors={errors} />
        <TextField
          label="Nome"
          name="name"
          value={name}
          message={fieldMessage(errors, 'name')}
          onChange={setName}
        />
        <ol className="list">
          {items.map((item, index) => (
            <li key={item.key} className="card">
              <TextField
                label="Título"
                name={`title-${index}`}
                value={item.title}
                message={fieldMessage(errors, `items.${index}.title`)}
                onChange={(value) =>
                  setItems((current) =>
                    current.map((row, rowIndex) => (rowIndex === index ? { ...row, title: value } : row))
                  )
                }
              />
              <label className="field">
                <span>Observação</span>
                <textarea
                  value={item.notes}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, notes: event.target.value } : row
                      )
                    )
                  }
                />
              </label>
              <TextField
                label="Duração (segundos)"
                name={`duration-${index}`}
                value={item.durationSeconds}
                message={fieldMessage(errors, `items.${index}.durationSeconds`)}
                onChange={(value) =>
                  setItems((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, durationSeconds: value } : row
                    )
                  )
                }
              />
              <div className="row">
                <button
                  type="button"
                  onClick={() =>
                    setItems((current) => {
                      if (index === 0) {
                        return current
                      }
                      const copy = [...current]
                      const [moved] = copy.splice(index, 1)
                      copy.splice(index - 1, 0, moved)
                      return copy
                    })
                  }
                >
                  Subir
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setItems((current) => {
                      if (index >= current.length - 1) {
                        return current
                      }
                      const copy = [...current]
                      const [moved] = copy.splice(index, 1)
                      copy.splice(index + 1, 0, moved)
                      return copy
                    })
                  }
                >
                  Descer
                </button>
                <button
                  type="button"
                  onClick={() => setItems((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                >
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ol>
        <div className="row">
          <button type="button" onClick={() => setItems((current) => [...current, blankItem()])}>
            Incluir item
          </button>
          <button type="submit">Salvar modelo</button>
        </div>
      </form>
    </section>
  )
}

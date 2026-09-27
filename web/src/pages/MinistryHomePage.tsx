import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { BRAZIL_TIMEZONES, type MinistryDetail } from '../lib/ministry.ts'
import type { NoticeItem, NoticeLists } from '../lib/notice.ts'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

export function MinistryHomePage() {
  const navigate = useNavigate()
  const { ministry, reload } = useMinistry()
  const [name, setName] = useState(ministry.name)
  const [timezone, setTimezone] = useState(ministry.timezone)
  const [color, setColor] = useState(ministry.color)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')
  const [leaveError, setLeaveError] = useState('')
  const [pinnedNotices, setPinnedNotices] = useState<NoticeItem[]>([])

  useEffect(() => {
    setName(ministry.name)
    setTimezone(ministry.timezone)
    setColor(ministry.color)
  }, [ministry.id, ministry.name, ministry.timezone, ministry.color])

  useEffect(() => {
    let cancelled = false
    void api<NoticeLists>(`/api/ministerios/${ministry.id}/avisos`).then((body) => {
      if (!cancelled) {
        setPinnedNotices(body.pinned)
      }
    })
    return () => {
      cancelled = true
    }
  }, [ministry.id])

  const zones = BRAZIL_TIMEZONES.includes(timezone)
    ? BRAZIL_TIMEZONES
    : [timezone, ...BRAZIL_TIMEZONES]

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice('')

    try {
      await api<MinistryDetail>(`/api/ministerios/${ministry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, timezone, color }),
      })
      setNotice('Ministério salvo.')
      await reload()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function leave() {
    setLeaveError('')
    try {
      await api(`/api/ministerios/${ministry.id}/sair`, { method: 'POST' })
      navigate('/ministerios', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setLeaveError(error.message)
        return
      }
      throw error
    }
  }

  return (
    <section>
      <h1>Início</h1>
      <p className="eyebrow">{ministry.name}</p>
      <div className="block-head">
        <span>
          Avisos <span className="count">{pinnedNotices.length}</span>
        </span>
        <Link to={`/m/${ministry.id}/avisos`}>Ver todos</Link>
      </div>
      {pinnedNotices.length === 0 ? (
        <p className="empty-line">Lista vazia.</p>
      ) : (
        <ul className="list">
          {pinnedNotices.map((item) => (
            <li key={item.id} className="card">
              <strong>{item.title}</strong>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="block-head">
        <span>
          Aniversariantes <span className="count">{ministry.birthdays.length}</span>
        </span>
      </div>
      {ministry.birthdays.length === 0 ? (
        <p className="empty-line">Lista vazia.</p>
      ) : (
        <ul className="list">
          {ministry.birthdays.map((person) => (
            <li key={person} className="card">
              {person}
            </li>
          ))}
        </ul>
      )}

      {ministry.membership.isAdmin ? (
        <form onSubmit={(event) => void save(event)} className="form">
          <FieldErrors errors={errors} />
          {notice ? <p className="notice">{notice}</p> : null}
          <TextField
            label="Nome"
            name="name"
            value={name}
            onChange={setName}
            message={fieldMessage(errors, 'name')}
          />
          <label className="field">
            <span>Fuso</span>
            <select
              name="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            {fieldMessage(errors, 'timezone') ? (
              <small>{fieldMessage(errors, 'timezone')}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Cor</span>
            <input
              name="color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
            {fieldMessage(errors, 'color') ? <small>{fieldMessage(errors, 'color')}</small> : null}
          </label>
          <button type="submit">Salvar</button>
        </form>
      ) : null}

      {leaveError ? <p className="errors">{leaveError}</p> : null}
      <button type="button" onClick={() => void leave()}>
        Sair do ministério
      </button>
    </section>
  )
}

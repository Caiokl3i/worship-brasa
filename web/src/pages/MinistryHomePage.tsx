import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { BRAZIL_TIMEZONES, type MinistryDetail } from '../lib/ministry.ts'
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

  useEffect(() => {
    setName(ministry.name)
    setTimezone(ministry.timezone)
    setColor(ministry.color)
  }, [ministry.id, ministry.name, ministry.timezone, ministry.color])

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
      <p className="eyebrow">Ministério</p>
      <h1>{ministry.name}</h1>
      <p className="row">
        <Link to="membros">Membros</Link>
        {ministry.membership.isAdmin ? <Link to="convite">Convite</Link> : null}
        <Link to="repertorio">Repertório</Link>
        <Link to="escalas">Escalas</Link>
      </p>

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
            <select name="timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)}>
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            {fieldMessage(errors, 'timezone') ? <small>{fieldMessage(errors, 'timezone')}</small> : null}
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

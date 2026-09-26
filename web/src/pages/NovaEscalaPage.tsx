import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { ScheduleDetail } from '../lib/schedule.ts'

const WEEKDAYS = [
  { value: 7, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

function weekdayOf(value: string) {
  const [date] = value.split('T')
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  const jsWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return jsWeekday === 0 ? 7 : jsWeekday
}

export function NovaEscalaPage() {
  const navigate = useNavigate()
  const { ministry } = useMinistry()
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [notes, setNotes] = useState('')
  const [dressCode, setDressCode] = useState('')
  const [repeat, setRepeat] = useState(false)
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [interval, setInterval] = useState('1')
  const [weekdays, setWeekdays] = useState<number[]>([])
  const [endsMode, setEndsMode] = useState<'never' | 'on_date' | 'after_count'>('never')
  const [endsOn, setEndsOn] = useState('')
  const [occurrenceCount, setOccurrenceCount] = useState('8')
  const [errors, setErrors] = useState<FieldError[]>([])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      const schedule = await api<ScheduleDetail>(`/api/ministerios/${ministry.id}/escalas`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          startsAt,
          endsAt: endsAt || null,
          notes,
          dressCode,
          ...(repeat
            ? {
                repeat: {
                  frequency,
                  interval: Number(interval),
                  weekdays,
                  endsMode,
                  endsOn: endsMode === 'on_date' ? endsOn : null,
                  occurrenceCount: endsMode === 'after_count' ? Number(occurrenceCount) : null,
                },
              }
            : {}),
        }),
      })
      navigate(`/m/${ministry.id}/escalas/${schedule.id}`, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  return (
    <section>
      <p className="eyebrow">Escalas</p>
      <h1>Nova escala</h1>
      <form className="form" onSubmit={(event) => void submit(event)}>
        <FieldErrors errors={errors} />
        <TextField
          label="Título"
          name="title"
          value={title}
          onChange={setTitle}
          message={fieldMessage(errors, 'title')}
        />
        <TextField
          label="Início"
          name="startsAt"
          type="datetime-local"
          value={startsAt}
          onChange={setStartsAt}
          message={fieldMessage(errors, 'startsAt')}
        />
        <TextField
          label="Término"
          name="endsAt"
          type="datetime-local"
          value={endsAt}
          onChange={setEndsAt}
          message={fieldMessage(errors, 'endsAt')}
        />
        <label className="field">
          <span>Observações</span>
          <textarea name="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <TextField label="Vestimenta" name="dressCode" value={dressCode} onChange={setDressCode} />
        <label className="checks">
          <span>
            <input
              type="checkbox"
              checked={repeat}
              onChange={(event) => {
                const checked = event.target.checked
                setRepeat(checked)
                if (checked) {
                  const day = weekdayOf(startsAt)
                  if (day) {
                    setWeekdays([day])
                  }
                }
              }}
            />{' '}
            Repetir
          </span>
        </label>
        {repeat ? (
          <>
            <label className="field">
              <span>Frequência</span>
              <select
                name="frequency"
                value={frequency}
                onChange={(event) =>
                  setFrequency(event.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly')
                }
              >
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </label>
            <TextField
              label="A cada"
              name="interval"
              type="number"
              value={interval}
              onChange={setInterval}
              message={fieldMessage(errors, 'interval')}
            />
            {frequency === 'weekly' ? (
              <div className="checks">
                <span>Dias da semana</span>
                {WEEKDAYS.map((day) => (
                  <label key={day.value}>
                    <input
                      type="checkbox"
                      checked={weekdays.includes(day.value)}
                      onChange={(event) =>
                        setWeekdays((current) =>
                          event.target.checked
                            ? [...current, day.value]
                            : current.filter((item) => item !== day.value)
                        )
                      }
                    />{' '}
                    {day.label}
                  </label>
                ))}
                {fieldMessage(errors, 'weekdays') ? <span className="errors">{fieldMessage(errors, 'weekdays')}</span> : null}
              </div>
            ) : null}
            <label className="field">
              <span>Término</span>
              <select
                name="endsMode"
                value={endsMode}
                onChange={(event) =>
                  setEndsMode(event.target.value as 'never' | 'on_date' | 'after_count')
                }
              >
                <option value="never">Não termina</option>
                <option value="on_date">Em uma data</option>
                <option value="after_count">Depois de algumas vezes</option>
              </select>
            </label>
            {endsMode === 'on_date' ? (
              <TextField
                label="Até"
                name="endsOn"
                type="date"
                value={endsOn}
                onChange={setEndsOn}
                message={fieldMessage(errors, 'endsOn')}
              />
            ) : null}
            {endsMode === 'after_count' ? (
              <TextField
                label="Quantidade"
                name="occurrenceCount"
                type="number"
                value={occurrenceCount}
                onChange={setOccurrenceCount}
                message={fieldMessage(errors, 'occurrenceCount')}
              />
            ) : null}
          </>
        ) : null}
        <button type="submit">Criar rascunho</button>
      </form>
      <p>
        <Link to={`/m/${ministry.id}/escalas`}>Voltar</Link>
      </p>
    </section>
  )
}

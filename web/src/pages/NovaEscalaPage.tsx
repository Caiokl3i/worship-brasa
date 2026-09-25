import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { ScheduleDetail } from '../lib/schedule.ts'

export function NovaEscalaPage() {
  const navigate = useNavigate()
  const { ministry } = useMinistry()
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [notes, setNotes] = useState('')
  const [dressCode, setDressCode] = useState('')
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
        <button type="submit">Criar rascunho</button>
      </form>
      <p>
        <Link to={`/m/${ministry.id}/escalas`}>Voltar</Link>
      </p>
    </section>
  )
}

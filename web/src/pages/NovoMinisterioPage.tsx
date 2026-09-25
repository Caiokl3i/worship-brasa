import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { WORSHIP_FUNCTIONS } from '../lib/ministry.ts'

export function NovoMinisterioPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<string[]>([...WORSHIP_FUNCTIONS])
  const [extra, setExtra] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  function toggle(functionName: string) {
    setSelected((current) =>
      current.includes(functionName)
        ? current.filter((item) => item !== functionName)
        : [...current, functionName]
    )
  }

  function addExtra(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = extra.trim()
    if (!trimmed) {
      return
    }
    setSelected((current) =>
      current.some((item) => item.toLowerCase() === trimmed.toLowerCase())
        ? current
        : [...current, trimmed]
    )
    setExtra('')
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      const ministry = await api<{ id: string }>('/api/ministerios', {
        method: 'POST',
        body: JSON.stringify({ name, functions: selected }),
      })
      navigate(`/m/${ministry.id}`, { replace: true })
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
      <p className="eyebrow">Ministério</p>
      <h1>Criar</h1>
      <form onSubmit={(event) => void submit(event)} className="form">
        <FieldErrors errors={errors} />
        <TextField
          label="Nome"
          name="name"
          value={name}
          onChange={setName}
          message={fieldMessage(errors, 'name')}
        />
        <div className="checks">
          {selected.map((functionName) => (
            <label key={functionName}>
              <input
                type="checkbox"
                checked
                onChange={() => toggle(functionName)}
              />{' '}
              {functionName}
            </label>
          ))}
          {WORSHIP_FUNCTIONS.filter((functionName) => !selected.includes(functionName)).map(
            (functionName) => (
              <label key={functionName}>
                <input type="checkbox" checked={false} onChange={() => toggle(functionName)} />{' '}
                {functionName}
              </label>
            )
          )}
        </div>
        <button type="submit">Criar ministério</button>
      </form>
      <form onSubmit={addExtra} className="form">
        <TextField label="Outra função" name="extra" value={extra} onChange={setExtra} />
        <button type="submit">Acrescentar</button>
      </form>
      <p>
        <Link to="/ministerios">Voltar</Link>
      </p>
    </section>
  )
}

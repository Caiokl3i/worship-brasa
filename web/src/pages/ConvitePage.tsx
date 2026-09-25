import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'

export function ConvitePage() {
  const params = useParams()
  const [code, setCode] = useState(params.codigo ?? '')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice('')

    try {
      const body = await api<{ ministryName: string }>('/api/convites/entrar', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      setNotice(`Pedido enviado para ${body.ministryName}.`)
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
      <p className="eyebrow">Convite</p>
      <h1>Entrar no ministério</h1>
      <form onSubmit={(event) => void submit(event)} className="form">
        <FieldErrors errors={errors} />
        {notice ? <p className="notice">{notice}</p> : null}
        <TextField
          label="Código"
          name="code"
          value={code}
          onChange={setCode}
          message={fieldMessage(errors, 'code')}
        />
        <button type="submit">Solicitar entrada</button>
      </form>
      <p>
        <Link to="/ministerios">Voltar</Link>
      </p>
    </section>
  )
}

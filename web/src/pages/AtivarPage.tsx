import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'

export function AtivarPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  async function confirm(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      await api('/api/ativar/confirmar', {
        method: 'POST',
        body: JSON.stringify({ name, email, code, password, passwordConfirmation }),
      })
      navigate('/entrar', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">Convite</p>
      <h1>Criar senha</h1>
      <form onSubmit={(event) => void confirm(event)} className="form">
        <FieldErrors errors={errors} />
        <TextField
          label="Nome"
          name="name"
          value={name}
          onChange={setName}
          message={fieldMessage(errors, 'name')}
        />
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          message={fieldMessage(errors, 'email')}
        />
        <TextField
          label="Código"
          name="code"
          autoComplete="one-time-code"
          value={code}
          onChange={setCode}
          message={fieldMessage(errors, 'code')}
        />
        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          message={fieldMessage(errors, 'password')}
        />
        <TextField
          label="Confirmar senha"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={setPasswordConfirmation}
          message={fieldMessage(errors, 'passwordConfirmation')}
        />
        <button type="submit">Criar conta</button>
      </form>
      <p>
        <Link to="/entrar">Voltar</Link>
      </p>
    </main>
  )
}

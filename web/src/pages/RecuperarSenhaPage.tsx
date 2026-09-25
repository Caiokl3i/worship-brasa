import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'

export function RecuperarSenhaPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'email' | 'codigo'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [notice, setNotice] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  async function askCode(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      const body = await api<{ message: string }>('/api/recuperar-senha', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      setNotice(body.message)
      setStep('codigo')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function confirm(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      await api('/api/recuperar-senha/confirmar', {
        method: 'POST',
        body: JSON.stringify({ email, code, password, passwordConfirmation }),
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
      <p className="eyebrow">Conta</p>
      <h1>Esqueci a senha</h1>
      {notice ? <p>{notice}</p> : null}
      {step === 'email' ? (
        <form onSubmit={(event) => void askCode(event)} className="form">
          <FieldErrors errors={errors} />
          <TextField
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            message={fieldMessage(errors, 'email')}
          />
          <button type="submit">Enviar código</button>
        </form>
      ) : (
        <form onSubmit={(event) => void confirm(event)} className="form">
          <FieldErrors errors={errors} />
          <TextField
            label="Código"
            name="code"
            autoComplete="one-time-code"
            value={code}
            onChange={setCode}
            message={fieldMessage(errors, 'code')}
          />
          <TextField
            label="Senha nova"
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
          <button type="submit">Salvar senha</button>
        </form>
      )}
      <p>
        <Link to="/entrar">Voltar</Link>
      </p>
    </main>
  )
}

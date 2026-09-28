import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthSplit } from '../components/AuthSplit.tsx'
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
    <AuthSplit
      footer={
        <p>
          <Link to="/entrar">← Voltar para o login</Link>
        </p>
      }
    >
      {notice ? <p className="notice-success">{notice}</p> : null}
      {step === 'email' ? (
        <form onSubmit={(event) => void askCode(event)} className="form auth-form">
          <FieldErrors errors={errors} />
          <TextField
            label="E-mail cadastrado"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            icon="mail"
            message={fieldMessage(errors, 'email')}
          />
          <button type="submit" className="button-primary auth-submit-btn">
            Enviar código
          </button>
        </form>
      ) : (
        <form onSubmit={(event) => void confirm(event)} className="form auth-form">
          <FieldErrors errors={errors} />
          <TextField
            label="Código recebido"
            name="code"
            autoComplete="one-time-code"
            value={code}
            onChange={setCode}
            icon="key"
            message={fieldMessage(errors, 'code')}
          />
          <TextField
            label="Nova senha"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            icon="lock"
            message={fieldMessage(errors, 'password')}
          />
          <TextField
            label="Confirmar nova senha"
            name="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={setPasswordConfirmation}
            icon="lock"
            message={fieldMessage(errors, 'passwordConfirmation')}
          />
          <button type="submit" className="button-primary auth-submit-btn">
            Salvar nova senha
          </button>
        </form>
      )}
    </AuthSplit>
  )
}

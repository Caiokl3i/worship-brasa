import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthSplit } from '../components/AuthSplit.tsx'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError, type PublicUser } from '../lib/api.ts'
import { useSession } from '../session.tsx'

export function EntrarPage() {
  const navigate = useNavigate()
  const { setUser } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [params] = useSearchParams()
  const googleNotice =
    params.get('google') === 'desconhecido'
      ? 'Não encontramos uma conta com este e-mail verificado.'
      : ''

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      const user = await api<PublicUser>('/api/entrar', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setUser(user)
      navigate('/ministerios', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function google() {
    setErrors([])
    try {
      const body = await api<{ url: string }>('/api/entrar/google', { method: 'POST' })
      window.location.assign(body.url)
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
          Não tem conta? <Link to="/cadastrar">Cadastre-se</Link>
        </p>
      }
    >
      <form onSubmit={(event) => void submit(event)} className="form auth-form">
        <FieldErrors errors={errors} />
        {googleNotice ? <p className="notice">{googleNotice}</p> : null}
        <TextField
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
          icon="mail"
          message={fieldMessage(errors, 'email')}
        />
        <TextField
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          icon="lock"
          message={fieldMessage(errors, 'password')}
        />
        <div className="auth-forgot-row">
          <Link to="/recuperar-senha">Esqueceu a senha?</Link>
        </div>
        <button type="submit" className="button-primary auth-submit-btn">
          Entrar
        </button>
        <button
          type="button"
          className="button-social-google"
          onClick={() => void google()}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Entrar com Google</span>
        </button>
      </form>
    </AuthSplit>
  )
}

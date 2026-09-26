import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
    <main className="page">
      <p className="eyebrow">Conta</p>
      <h1>Entrar</h1>
      <form onSubmit={(event) => void submit(event)} className="form">
        <FieldErrors errors={errors} />
        {googleNotice ? <p className="notice">{googleNotice}</p> : null}
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
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          message={fieldMessage(errors, 'password')}
        />
        <button type="submit">Entrar</button>
        <button type="button" onClick={() => void google()}>
          Entrar com Google
        </button>
      </form>
      <p>
        <Link to="/cadastrar">Criar conta</Link>
        {' · '}
        <Link to="/recuperar-senha">Esqueci a senha</Link>
      </p>
    </main>
  )
}

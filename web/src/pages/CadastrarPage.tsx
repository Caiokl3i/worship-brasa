import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError, type PublicUser } from '../lib/api.ts'
import { useSession } from '../session.tsx'

export function CadastrarPage() {
  const navigate = useNavigate()
  const { setUser } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])

    try {
      const user = await api<PublicUser>('/api/cadastrar', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, passwordConfirmation }),
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

  return (
    <main className="page">
      <p className="eyebrow">Conta</p>
      <h1>Cadastrar</h1>
      <form onSubmit={(event) => void submit(event)} className="form">
        <FieldErrors errors={errors} />
        <TextField
          label="Nome"
          name="name"
          autoComplete="name"
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
        <Link to="/entrar">Já tenho conta</Link>
      </p>
    </main>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError, type PublicUser } from '../lib/api.ts'
import { useSession } from '../session.tsx'

export function PerfilPage() {
  const { user, setUser } = useSession()
  const [name, setName] = useState(user?.name ?? '')
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '')
  const [profileErrors, setProfileErrors] = useState<FieldError[]>([])
  const [profileNotice, setProfileNotice] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordErrors, setPasswordErrors] = useState<FieldError[]>([])
  const [passwordNotice, setPasswordNotice] = useState('')

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault()
    setProfileErrors([])
    setProfileNotice('')

    try {
      const updated = await api<PublicUser>('/api/perfil', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          birthDate: birthDate === '' ? null : birthDate,
        }),
      })
      setUser(updated)
      setProfileNotice('Perfil salvo.')
    } catch (error) {
      if (error instanceof ApiError) {
        setProfileErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault()
    setPasswordErrors([])
    setPasswordNotice('')

    try {
      const updated = await api<PublicUser>('/api/perfil/senha', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
      })
      setUser(updated)
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
      setPasswordNotice('Senha atualizada.')
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordErrors(error.errors)
        return
      }
      throw error
    }
  }

  return (
    <section>
      <p className="eyebrow">Conta</p>
      <h1>Perfil</h1>

      <form onSubmit={(event) => void saveProfile(event)} className="form">
        <FieldErrors errors={profileErrors} />
        {profileNotice ? <p>{profileNotice}</p> : null}
        <TextField
          label="Nome"
          name="name"
          value={name}
          onChange={setName}
          message={fieldMessage(profileErrors, 'name')}
        />
        <TextField label="E-mail" name="email" type="email" value={user?.email ?? ''} readOnly />
        <TextField
          label="Data de nascimento"
          name="birthDate"
          type="date"
          value={birthDate}
          onChange={setBirthDate}
          message={fieldMessage(profileErrors, 'birthDate')}
        />
        <button type="submit">Salvar</button>
      </form>

      <form onSubmit={(event) => void savePassword(event)} className="form">
        <h2>Alterar senha</h2>
        <FieldErrors errors={passwordErrors} />
        {passwordNotice ? <p>{passwordNotice}</p> : null}
        <TextField
          label="Senha atual"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={setCurrentPassword}
          message={fieldMessage(passwordErrors, 'currentPassword')}
        />
        <TextField
          label="Senha nova"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          message={fieldMessage(passwordErrors, 'password')}
        />
        <TextField
          label="Confirmar senha"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          value={passwordConfirmation}
          onChange={setPasswordConfirmation}
          message={fieldMessage(passwordErrors, 'passwordConfirmation')}
        />
        <button type="submit">Atualizar senha</button>
      </form>

      <p>
        <Link to="/ministerios">Voltar</Link>
      </p>
    </section>
  )
}

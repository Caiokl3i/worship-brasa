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
  const [calendarNotice, setCalendarNotice] = useState('')
  const [calendarError, setCalendarError] = useState('')

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

  async function connectCalendar() {
    setCalendarError('')
    setCalendarNotice('')
    try {
      const body = await api<{ connected: boolean; url?: string }>('/api/agenda/conectar', {
        method: 'POST',
      })
      if (body.url) {
        window.location.assign(body.url)
        return
      }
      if (user) {
        setUser({ ...user, calendarConnected: true })
      }
      setCalendarNotice('Agenda conectada.')
    } catch (error) {
      if (error instanceof ApiError) {
        setCalendarError(error.message)
        return
      }
      throw error
    }
  }

  async function disconnectCalendar() {
    setCalendarError('')
    setCalendarNotice('')
    await api('/api/agenda', { method: 'DELETE' })
    if (user) {
      setUser({ ...user, calendarConnected: false })
    }
    setCalendarNotice('Agenda desconectada. Os eventos futuros foram apagados.')
  }

  const agendaQuery = new URLSearchParams(window.location.search).get('agenda')

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

      <div className="form">
        <h2>Google Agenda</h2>
        {calendarError ? <p className="errors">{calendarError}</p> : null}
        {calendarNotice ? <p className="notice">{calendarNotice}</p> : null}
        {agendaQuery === 'conectada' ? <p className="notice">Agenda conectada.</p> : null}
        {agendaQuery === 'erro' ? (
          <p className="errors">Não foi possível conectar a agenda.</p>
        ) : null}
        {user?.calendarConnected ? (
          <button type="button" onClick={() => void disconnectCalendar()}>
            Desconectar
          </button>
        ) : (
          <button type="button" onClick={() => void connectCalendar()}>
            Conectar
          </button>
        )}
      </div>

      <p className="row">
        <Link to="/notificacoes">Notificações</Link>
        <Link to="/ministerios">Voltar</Link>
      </p>
    </section>
  )
}

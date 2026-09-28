import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { Icon } from '../components/Icon.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { BRAZIL_TIMEZONES, type MinistryDetail } from '../lib/ministry.ts'
import type { NoticeItem, NoticeLists } from '../lib/notice.ts'
import type { ScheduleLists } from '../lib/schedule.ts'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

export function MinistryHomePage() {
  const navigate = useNavigate()
  const { ministry, reload } = useMinistry()
  const [name, setName] = useState(ministry.name)
  const [timezone, setTimezone] = useState(ministry.timezone)
  const [color, setColor] = useState(ministry.color)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')
  const [leaveError, setLeaveError] = useState('')
  const [pinnedNotices, setPinnedNotices] = useState<NoticeItem[]>([])
  const [mySchedules, setMySchedules] = useState<ScheduleLists['upcoming']>([])

  useEffect(() => {
    setName(ministry.name)
    setTimezone(ministry.timezone)
    setColor(ministry.color)
  }, [ministry.id, ministry.name, ministry.timezone, ministry.color])

  useEffect(() => {
    let cancelled = false
    void api<NoticeLists>(`/api/ministerios/${ministry.id}/avisos`).then((body) => {
      if (!cancelled) {
        setPinnedNotices(body.pinned)
      }
    })
    void api<ScheduleLists>(`/api/ministerios/${ministry.id}/escalas`).then((body) => {
      if (!cancelled) {
        setMySchedules(body.upcoming || [])
      }
    }).catch(() => {})

    return () => {
      cancelled = true
    }
  }, [ministry.id])

  const zones = BRAZIL_TIMEZONES.includes(timezone)
    ? BRAZIL_TIMEZONES
    : [timezone, ...BRAZIL_TIMEZONES]

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice('')

    try {
      await api<MinistryDetail>(`/api/ministerios/${ministry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, timezone, color }),
      })
      setNotice('Ministério salvo com sucesso.')
      await reload()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function leave() {
    setLeaveError('')
    try {
      await api(`/api/ministerios/${ministry.id}/sair`, { method: 'POST' })
      navigate('/ministerios', { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setLeaveError(error.message)
        return
      }
      throw error
    }
  }

  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date())
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1)

  return (
    <div className="dashboard-container">
      {/* 1. SEÇÃO MINISTÉRIOS */}
      <section className="dashboard-section">
        <div className="block-head">
          <div className="block-title-group">
            <span className="block-label">Ministérios</span>
            <span className="count">1</span>
          </div>
          <Link to="/ministerios" className="block-action">
            Ver todos <Icon name="chevron-right" size={14} />
          </Link>
        </div>

        <div className="ministry-active-card">
          <div className="ministry-avatar" style={{ backgroundColor: ministry.color || '#2b4678' }}>
            <span>{ministry.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="ministry-details">
            <h3 className="ministry-title">{ministry.name}</h3>
            <div className="ministry-meta-row">
              <span className="meta-stat">
                <Icon name="calendar" size={14} />
                <span>{mySchedules.length}</span>
              </span>
              <span className="meta-stat">
                <Icon name="music" size={14} />
                <span>{ministry.musicModuleEnabled ? 'Ativo' : '0'}</span>
              </span>
              <span className="meta-stat">
                <Icon name="users" size={14} />
                <span>1</span>
              </span>
            </div>
          </div>
          <div className="ministry-check-badge" title="Ministério ativo">
            <Icon name="check" size={14} color="#ffffff" />
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO AVISOS */}
      <section className="dashboard-section">
        <div className="block-head">
          <div className="block-title-group">
            <span className="block-label">Avisos</span>
            <span className="count">{pinnedNotices.length}</span>
          </div>
          <Link to={`/m/${ministry.id}/avisos`} className="block-action">
            Ver todos <Icon name="chevron-right" size={14} />
          </Link>
        </div>
        <p className="block-subtitle">Em destaque</p>

        {pinnedNotices.length === 0 ? (
          <div className="empty-state-card">
            <Icon name="announcements" size={20} className="empty-icon" />
            <span>Lista vazia.</span>
          </div>
        ) : (
          <ul className="dashboard-card-list">
            {pinnedNotices.map((item) => (
              <li key={item.id} className="card dashboard-item-card">
                <div className="card-header-line">
                  <Icon name="announcements" size={16} className="item-leading-icon" />
                  <strong>{item.title}</strong>
                </div>
                <p className="card-snippet">{item.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 3. SEÇÃO MINHAS ESCALAS */}
      <section className="dashboard-section">
        <div className="block-head">
          <div className="block-title-group">
            <span className="block-label">Minhas Escalas</span>
            <span className="count">{mySchedules.length}</span>
          </div>
          <Link to={`/m/${ministry.id}/escalas`} className="block-action">
            Ver todas <Icon name="chevron-right" size={14} />
          </Link>
        </div>
        <p className="block-subtitle">Próximas</p>

        {mySchedules.length === 0 ? (
          <div className="empty-state-card">
            <Icon name="calendar" size={20} className="empty-icon" />
            <span>Lista vazia.</span>
          </div>
        ) : (
          <ul className="dashboard-card-list">
            {mySchedules.map((schedule) => (
              <li key={schedule.id} className="card dashboard-item-card">
                <Link to={`/m/${ministry.id}/escalas/${schedule.id}`} className="schedule-card-link">
                  <div className="card-header-line">
                    <Icon name="calendar" size={16} className="item-leading-icon" />
                    <strong>{schedule.title}</strong>
                  </div>
                  <span className="schedule-time">{schedule.startsAt}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 4. SEÇÃO ANIVERSARIANTES */}
      <section className="dashboard-section">
        <div className="block-head">
          <div className="block-title-group">
            <span className="block-label">Aniversariantes</span>
            <span className="count">{ministry.birthdays.length}</span>
          </div>
          <span className="block-action-disabled">
            Ver todos <Icon name="chevron-right" size={14} />
          </span>
        </div>
        <p className="block-subtitle">{capitalizedMonth}</p>

        {ministry.birthdays.length === 0 ? (
          <div className="empty-state-card">
            <Icon name="cake" size={20} className="empty-icon" />
            <span>Lista vazia.</span>
          </div>
        ) : (
          <ul className="dashboard-card-list">
            {ministry.birthdays.map((person) => (
              <li key={person} className="card birthday-card">
                <Icon name="cake" size={18} className="item-leading-icon" />
                <span>{person}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 5. SEÇÃO DESTAQUE / TOP HITS */}
      {ministry.musicModuleEnabled ? (
        <Link to={`/m/${ministry.id}/repertorio`} className="promo-banner-card">
          <div className="promo-icon-circle">
            <Icon name="music" size={20} />
          </div>
          <div className="promo-content">
            <h4 className="promo-title">Repertório Musical</h4>
            <p className="promo-description">Explore cifras, letras e arranjos da equipe no LouveApp.</p>
          </div>
          <Icon name="chevron-right" size={20} className="promo-arrow" />
        </Link>
      ) : null}

      {/* 6. CONFIGURAÇÕES DO MINISTÉRIO */}
      {ministry.membership.isAdmin ? (
        <section className="dashboard-section config-section">
          <div className="block-head">
            <span className="block-label">Configurações do Ministério</span>
          </div>
          <form onSubmit={(event) => void save(event)} className="form card settings-card">
            <FieldErrors errors={errors} />
            {notice ? <p className="notice">{notice}</p> : null}
            <TextField
              label="Nome do ministério"
              name="name"
              value={name}
              onChange={setName}
              message={fieldMessage(errors, 'name')}
            />
            <label className="field">
              <span>Fuso horário</span>
              <select
                name="timezone"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              >
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {zone}
                  </option>
                ))}
              </select>
              {fieldMessage(errors, 'timezone') ? (
                <small>{fieldMessage(errors, 'timezone')}</small>
              ) : null}
            </label>
            <label className="field">
              <span>Cor do tema</span>
              <input
                name="color"
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
              {fieldMessage(errors, 'color') ? <small>{fieldMessage(errors, 'color')}</small> : null}
            </label>
            <button type="submit" className="button-primary">Salvar alterações</button>
          </form>
        </section>
      ) : null}

      <div className="leave-section">
        {leaveError ? <p className="errors">{leaveError}</p> : null}
        <button type="button" className="button-danger-outline" onClick={() => void leave()}>
          Sair do ministério
        </button>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { Icon } from '../components/Icon.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { BRAZIL_TIMEZONES, type MinistryDetail, type MinistryList, type MinistrySummary } from '../lib/ministry.ts'
import type { NoticeItem, NoticeLists } from '../lib/notice.ts'
import type { ScheduleLists } from '../lib/schedule.ts'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

function zonedDateKey(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

function relativeDay(iso: string, timeZone: string) {
  const today = zonedDateKey(new Date().toISOString(), timeZone)
  const that = zonedDateKey(iso, timeZone)
  const diff = Math.round((Date.parse(that) - Date.parse(today)) / 86400000)
  if (diff === 0) {
    return 'hoje'
  }
  if (diff === 1) {
    return 'amanhã'
  }
  if (diff === -1) {
    return 'ontem'
  }
  if (diff > 1 && diff < 7) {
    return `daqui a ${diff} dias`
  }
  if (diff >= 7 && diff < 14) {
    return 'daqui a 1 semana'
  }
  if (diff >= 14 && diff < 21) {
    return 'daqui a 2 semanas'
  }
  if (diff >= 21) {
    return `daqui a ${Math.round(diff / 7)} semanas`
  }
  return ''
}

function scheduleFace(iso: string, timeZone: string) {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat('pt-BR', { timeZone, day: 'numeric' }).format(date)
  const month = new Intl.DateTimeFormat('pt-BR', { timeZone, month: 'long' }).format(date)
  const weekday = new Intl.DateTimeFormat('pt-BR', { timeZone, weekday: 'long' }).format(date).split('-')[0]
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
  const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
  return {
    when: `${day} ${label(month)}`,
    line: `${label(weekday)}, ${time}`,
    relative: relativeDay(iso, timeZone),
  }
}

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
  const [noticeTotal, setNoticeTotal] = useState(0)
  const [mySchedules, setMySchedules] = useState<ScheduleLists['upcoming']>([])
  const [ministries, setMinistries] = useState<MinistrySummary[]>([])

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
        setNoticeTotal(body.notices.length)
      }
    })
    void api<ScheduleLists>(`/api/ministerios/${ministry.id}/escalas`).then((body) => {
      if (!cancelled) {
        setMySchedules(body.upcoming || [])
      }
    }).catch(() => {})

    void api<MinistryList>('/api/ministerios').then((body) => {
      if (!cancelled) {
        setMinistries(body.active)
      }
    })

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
    <div className="dashboard-container home-dashboard">
      <section className="dashboard-section">
        <div className="block-head">
          <div className="block-title-group">
            <span className="block-label">Ministérios</span>
            <span className="count">{ministries.length || 1}</span>
          </div>
          <Link to="/ministerios" className="block-action">
            Adicionar <Icon name="plus" size={14} />
          </Link>
        </div>
        <p className="block-subtitle">Toque para selecionar o ministério</p>
        <div className="home-rail">
          {(ministries.length > 0 ? ministries : [ministry]).map((item) => {
            const current = item.id === ministry.id
            return (
              <Link
                key={item.id}
                to={`/m/${item.id}`}
                className={current ? 'home-ministry is-current' : 'home-ministry'}
                style={{ background: item.color || '#2b4678' }}
              >
                <strong>{item.name}</strong>
                {current ? (
                  <span className="home-ministry-check" aria-label="Ministério selecionado">
                    <Icon name="check" size={12} color="#ffffff" />
                  </span>
                ) : (
                  <Icon name="chevron-right" size={16} />
                )}
              </Link>
            )
          })}
        </div>
      </section>

      {/* 2. SEÇÃO AVISOS */}
      <section className="dashboard-section">
        <div className="block-head">
          <div className="block-title-group">
            <span className="block-label">Avisos</span>
            <span className="count">
              {pinnedNotices.length}/{noticeTotal}
            </span>
          </div>
          <Link to={`/m/${ministry.id}/avisos`} className="block-action">
            Ver todos <Icon name="chevron-right" size={14} />
          </Link>
        </div>
        <p className="block-subtitle">Em destaque</p>

        {pinnedNotices.length === 0 ? (
          <div className="empty-state-card">
            <Icon name="megaphone" size={20} className="empty-icon" />
            <span>Lista vazia.</span>
          </div>
        ) : (
          <div className="home-rail">
            {pinnedNotices.map((item) => (
              <Link key={item.id} to={`/m/${ministry.id}/avisos?aviso=${item.id}`} className="home-slide card">
                <div className="card-header-line">
                  <Icon name="megaphone" size={16} className="item-leading-icon" />
                  <strong>{item.title}</strong>
                </div>
                <p className="card-snippet">{item.body}</p>
              </Link>
            ))}
          </div>
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
            Ver todos <Icon name="chevron-right" size={14} />
          </Link>
        </div>
        <p className="block-subtitle">Próximas</p>

        {mySchedules.length === 0 ? (
          <div className="empty-state-card">
            <Icon name="calendar" size={20} className="empty-icon" />
            <span>Lista vazia.</span>
          </div>
        ) : (
          <div className="home-rail">
            {mySchedules.map((schedule) => {
              const face = scheduleFace(schedule.startsAt, ministry.timezone)
              return (
                <Link key={schedule.id} to={`/m/${ministry.id}/escalas/${schedule.id}`} className="home-slide card home-schedule">
                  <span className="home-schedule-top">
                    <strong>{schedule.title}</strong>
                    <span className="home-schedule-date">{face.when}</span>
                  </span>
                  <span>
                    {face.line}
                    {face.relative ? ` · ${face.relative}` : ''}
                  </span>
                  {schedule.status === 'draft' ? <em>Rascunho</em> : null}
                </Link>
              )
            })}
          </div>
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
          <div className="home-rail">
            {ministry.birthdays.map((person) => (
              <div key={person} className="home-slide card home-birthday">
                <Icon name="cake" size={18} className="item-leading-icon" />
                <span>{person}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. SEÇÃO DESTAQUE / TOP HITS */}
      {ministry.musicModuleEnabled ? (
        <Link to={`/m/${ministry.id}/repertorio`} className="promo-banner-card">
          <div className="promo-icon-circle">
            <Icon name="music" size={20} />
          </div>
          <div className="promo-content">
            <h4 className="promo-title">Mais tocadas</h4>
            <p className="promo-description">Confira o que está em alta no LouveApp.</p>
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
            {notice ? <p className="notice-success">{notice}</p> : null}
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

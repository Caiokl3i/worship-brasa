import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api } from '../lib/api.ts'
import { formatInZone, type ScheduleLists, type ScheduleSummary } from '../lib/schedule.ts'
import { Icon } from '../components/Icon.tsx'

export function EscalasPage() {
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const [lists, setLists] = useState<ScheduleLists | null>(null)
  const [which, setWhich] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    void api<ScheduleLists>(`/api/ministerios/${ministry.id}/escalas`).then(setLists)
  }, [ministry.id])

  return (
    <div className="dashboard-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Escalas</h1>
          <p className="eyebrow">{ministry.name}</p>
        </div>
        {canManage ? (
          <Link className="button-primary-compact" to={`/m/${ministry.id}/escalas/nova`}>
            <Icon name="plus" size={16} /> Nova Escala
          </Link>
        ) : null}
      </div>

      <div className="segment">
        <button
          type="button"
          aria-selected={which === 'upcoming'}
          onClick={() => setWhich('upcoming')}
        >
          Próximas
        </button>
        <button type="button" aria-selected={which === 'past'} onClick={() => setWhich('past')}>
          Anteriores
        </button>
      </div>

      {lists === null ? (
        <div className="page-loading">
          <p>Carregando escalas…</p>
        </div>
      ) : null}

      {lists && (which === 'upcoming' ? lists.upcoming : lists.past).length === 0 ? (
        <div className="empty-state-card empty-state-large">
          <Icon name="calendar" size={32} className="empty-icon" />
          <p>Nenhuma escala {which === 'upcoming' ? 'agendada' : 'anterior'}.</p>
        </div>
      ) : null}

      {lists && which === 'upcoming' && lists.upcoming.length > 0 ? (
        <ScheduleList
          items={lists.upcoming}
          ministryId={ministry.id}
          timeZone={ministry.timezone}
        />
      ) : null}

      {lists && which === 'past' && lists.past.length > 0 ? (
        <ScheduleList
          items={lists.past}
          ministryId={ministry.id}
          timeZone={ministry.timezone}
        />
      ) : null}

      {canManage ? (
        <Link
          className="fab"
          to={`/m/${ministry.id}/escalas/nova`}
          title="Nova Escala"
          aria-label="Criar nova escala"
        >
          <Icon name="plus" size={24} />
        </Link>
      ) : null}
    </div>
  )
}

function ScheduleList({
  items,
  ministryId,
  timeZone,
}: {
  items: ScheduleSummary[]
  ministryId: string
  timeZone: string
}) {
  return (
    <ul className="dashboard-card-list">
      {items.map((schedule) => {
        const dateObj = new Date(schedule.startsAt)
        const day = isNaN(dateObj.getDate()) ? '–' : String(dateObj.getDate()).padStart(2, '0')
        const month = isNaN(dateObj.getMonth())
          ? ''
          : dateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()

        return (
          <li key={schedule.id} className="card schedule-list-item">
            <Link to={`/m/${ministryId}/escalas/${schedule.id}`} className="schedule-item-link">
              <div className="schedule-date-badge">
                <span className="date-badge-day">{day}</span>
                <span className="date-badge-month">{month}</span>
              </div>
              <div className="schedule-info-col">
                <strong className="schedule-title">{schedule.title}</strong>
                <span className="schedule-time-row">
                  <Icon name="clock" size={13} />
                  <span>
                    {formatInZone(schedule.startsAt, timeZone)}
                    {schedule.endsAt ? ` – ${formatInZone(schedule.endsAt, timeZone)}` : ''}
                  </span>
                </span>
              </div>
              <div className="schedule-badges-col">
                {schedule.status === 'draft' ? (
                  <span className="badge badge-draft">Rascunho</span>
                ) : (
                  <span className="badge badge-published">Confirmada</span>
                )}
                <Icon name="chevron-right" size={16} className="item-arrow" />
              </div>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

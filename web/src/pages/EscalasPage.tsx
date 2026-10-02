import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api } from '../lib/api.ts'
import type { ScheduleLists, ScheduleSummary } from '../lib/schedule.ts'

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
    return 'Hoje'
  }
  if (diff === 1) {
    return 'Amanhã'
  }
  if (diff === -1) {
    return 'Ontem'
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
  if (diff < -1 && diff > -7) {
    return `há ${Math.abs(diff)} dias`
  }
  return ''
}

function dayParts(iso: string, timeZone: string) {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat('pt-BR', { timeZone, day: 'numeric' }).format(date)
  const month = new Intl.DateTimeFormat('pt-BR', { timeZone, month: 'short' })
    .format(date)
    .replace('.', '')
  const weekday = new Intl.DateTimeFormat('pt-BR', { timeZone, weekday: 'long' })
    .format(date)
    .split('-')[0]
  const time = new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
  return {
    day,
    month: month.charAt(0).toUpperCase() + month.slice(1),
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    time,
    relative: relativeDay(iso, timeZone),
  }
}

function groupByDay(items: ScheduleSummary[], timeZone: string) {
  const groups: Array<{ key: string; iso: string; items: ScheduleSummary[] }> = []
  for (const item of items) {
    const key = zonedDateKey(item.startsAt, timeZone)
    const last = groups.at(-1)
    if (last?.key === key) {
      last.items.push(item)
    } else {
      groups.push({ key, iso: item.startsAt, items: [item] })
    }
  }
  return groups
}

export function EscalasPage() {
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const [lists, setLists] = useState<ScheduleLists | null>(null)
  const [which, setWhich] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    void api<ScheduleLists>(`/api/ministerios/${ministry.id}/escalas`).then(setLists)
  }, [ministry.id])

  const items = lists ? (which === 'upcoming' ? lists.upcoming : lists.past) : []
  const groups = groupByDay(items, ministry.timezone)

  return (
    <div className="dashboard-container schedule-agenda">
      <header className="notice-top">
        <span />
        <div className="notice-top-title">
          <h1>Escalas</h1>
          <p>{ministry.name}</p>
        </div>
        <span />
      </header>

      {canManage ? (
        <Link className="schedule-panorama" to={`/m/${ministry.id}/relatorios`}>
          <Icon name="reports" size={16} /> Panorama de escalas
        </Link>
      ) : null}

      <div className="segment schedule-segment">
        <button type="button" aria-selected={which === 'upcoming'} onClick={() => setWhich('upcoming')}>
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

      {lists && items.length === 0 ? (
        <div className="empty-state-card empty-state-large">
          <Icon name="calendar" size={32} className="empty-icon" />
          <p>Nenhuma escala {which === 'upcoming' ? 'agendada' : 'anterior'}.</p>
        </div>
      ) : null}

      <div className="schedule-days">
        {groups.map((group) => {
          const parts = dayParts(group.iso, ministry.timezone)
          return (
            <section key={group.key} className="schedule-day">
              <header className="schedule-day-label">
                <strong>{parts.day}</strong>
                <span>{parts.month}</span>
                <span className="schedule-day-dot" aria-hidden="true">
                  •
                </span>
                <span>{parts.weekday}</span>
                {parts.relative ? <em>{parts.relative}</em> : null}
              </header>
              <ul>
                {group.items.map((schedule) => (
                  <li key={schedule.id}>
                    <Link to={`/m/${ministry.id}/escalas/${schedule.id}`}>
                      <strong>{schedule.title}</strong>
                      <span>{dayParts(schedule.startsAt, ministry.timezone).time}</span>
                      {schedule.status === 'draft' ? <em>Rascunho</em> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      {canManage ? (
        <Link className="notice-add" to={`/m/${ministry.id}/escalas/nova`}>
          <Icon name="plus" size={16} /> Adicionar
        </Link>
      ) : null}
    </div>
  )
}

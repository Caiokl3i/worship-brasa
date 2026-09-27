import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api } from '../lib/api.ts'
import { formatInZone, type ScheduleLists, type ScheduleSummary } from '../lib/schedule.ts'

export function EscalasPage() {
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const [lists, setLists] = useState<ScheduleLists | null>(null)
  const [which, setWhich] = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    void api<ScheduleLists>(`/api/ministerios/${ministry.id}/escalas`).then(setLists)
  }, [ministry.id])

  return (
    <section>
      <h1>Escalas</h1>
      <p className="eyebrow">{ministry.name}</p>
      {canManage ? (
        <Link className="fab" to={`/m/${ministry.id}/escalas/nova`}>
          +
        </Link>
      ) : null}
      {lists === null ? <p>Carregando…</p> : null}
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
      {lists && (which === 'upcoming' ? lists.upcoming : lists.past).length === 0 ? (
        <p className="empty-line">Lista vazia.</p>
      ) : null}
      {lists && which === 'upcoming' && lists.upcoming.length > 0 ? (
        <ScheduleGroup
          title="Próximas"
          items={lists.upcoming}
          ministryId={ministry.id}
          timeZone={ministry.timezone}
        />
      ) : null}
      {lists && which === 'past' && lists.past.length > 0 ? (
        <ScheduleGroup
          title="Anteriores"
          items={lists.past}
          ministryId={ministry.id}
          timeZone={ministry.timezone}
        />
      ) : null}
    </section>
  )
}

function ScheduleGroup({
  title,
  items,
  ministryId,
  timeZone,
}: {
  title: string
  items: ScheduleSummary[]
  ministryId: string
  timeZone: string
}) {
  return (
    <>
      <h2>{title}</h2>
      <ul className="list">
        {items.map((schedule) => (
          <li key={schedule.id} className="card">
            <Link to={`/m/${ministryId}/escalas/${schedule.id}`}>{schedule.title}</Link>
            <span>
              {formatInZone(schedule.startsAt, timeZone)}
              {schedule.endsAt ? ` – ${formatInZone(schedule.endsAt, timeZone)}` : ''}
            </span>
            {schedule.status === 'draft' ? <span className="badge">Rascunho</span> : null}
          </li>
        ))}
      </ul>
    </>
  )
}

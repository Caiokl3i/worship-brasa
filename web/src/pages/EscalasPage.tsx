import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api } from '../lib/api.ts'
import { formatInZone, type ScheduleLists, type ScheduleSummary } from '../lib/schedule.ts'

export function EscalasPage() {
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const [lists, setLists] = useState<ScheduleLists | null>(null)

  useEffect(() => {
    void api<ScheduleLists>(`/api/ministerios/${ministry.id}/escalas`).then(setLists)
  }, [ministry.id])

  const empty = lists && lists.upcoming.length === 0 && lists.past.length === 0

  return (
    <section>
      <p className="eyebrow">Escalas</p>
      <div className="row">
        <h1>{ministry.name}</h1>
        {canManage ? <Link to={`/m/${ministry.id}/escalas/nova`}>Nova escala</Link> : null}
      </div>
      {lists === null ? <p>Carregando…</p> : null}
      {empty ? <p>Ainda não há escalas neste ministério.</p> : null}
      {lists && lists.upcoming.length > 0 ? (
        <ScheduleGroup
          title="Próximas"
          items={lists.upcoming}
          ministryId={ministry.id}
          timeZone={ministry.timezone}
        />
      ) : null}
      {lists && lists.past.length > 0 ? (
        <ScheduleGroup
          title="Passadas"
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

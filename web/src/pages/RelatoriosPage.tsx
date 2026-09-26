import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { Panorama, ReportOverview, ReportRange } from '../lib/report.ts'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
}

function monthBounds(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const last = new Date(year, monthNumber, 0).getDate()
  return { from: `${month}-01`, to: `${month}-${pad(last)}` }
}

function conflictLabel(kinds: { kind: string }[]) {
  const labels = []
  if (kinds.some((item) => item.kind === 'schedule')) {
    labels.push('Conflito')
  }
  if (kinds.some((item) => item.kind === 'unavailability')) {
    labels.push('Indisponível')
  }
  return labels.join(', ')
}

export function RelatoriosPage() {
  const { ministry } = useMinistry()
  const initial = monthBounds(currentMonth())
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [month, setMonth] = useState(currentMonth())
  const [overview, setOverview] = useState<ReportOverview | null>(null)
  const [report, setReport] = useState<ReportRange | null>(null)
  const [panorama, setPanorama] = useState<Panorama | null>(null)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false
    void api<ReportOverview>(`/api/ministerios/${ministry.id}/relatorios/visao`)
      .then((body) => {
        if (!cancelled) {
          setOverview(body)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled && error instanceof ApiError) {
          setNotice(error.message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [ministry.id])

  useEffect(() => {
    let cancelled = false
    void loadRange(initial.from, initial.to)
    return () => {
      cancelled = true
    }

    async function loadRange(start: string, end: string) {
      try {
        const body = await api<ReportRange>(
          `/api/ministerios/${ministry.id}/relatorios?from=${start}&to=${end}`
        )
        if (!cancelled) {
          setReport(body)
        }
      } catch (error) {
        if (!cancelled && error instanceof ApiError) {
          setErrors(error.errors)
        }
      }
    }
  }, [ministry.id, initial.from, initial.to])

  useEffect(() => {
    let cancelled = false
    void api<Panorama>(`/api/ministerios/${ministry.id}/relatorios/panorama?month=${month}`)
      .then((body) => {
        if (!cancelled) {
          setPanorama(body)
          setErrors((current) => current.filter((error) => error.field !== 'month'))
        }
      })
      .catch((error: unknown) => {
        if (!cancelled && error instanceof ApiError) {
          setErrors(error.errors)
        }
      })
    return () => {
      cancelled = true
    }
  }, [ministry.id, month])

  async function applyRange(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    try {
      const body = await api<ReportRange>(
        `/api/ministerios/${ministry.id}/relatorios?from=${from}&to=${to}`
      )
      setReport(body)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  return (
    <section>
      <p className="eyebrow">Ministério</p>
      <h1>Relatórios</h1>
      <p>
        <Link to="..">Voltar</Link>
      </p>
      {notice ? <p>{notice}</p> : null}

      {overview ? (
        <div className="card">
          <h2>Este mês</h2>
          <p>{overview.schedules} escalas</p>
          <p>{overview.participations} escalações</p>
          <p>{overview.assignments} atribuições</p>
          <p>
            Confirmações: {overview.confirmations.pending} pendentes,{' '}
            {overview.confirmations.confirmed} confirmadas, {overview.confirmations.declined}{' '}
            recusadas
          </p>
          <p>{overview.absences} faltas</p>
        </div>
      ) : null}

      <form onSubmit={(event) => void applyRange(event)} className="form">
        <FieldErrors errors={errors.filter((error) => error.field !== 'month')} />
        <TextField
          label="Início"
          name="from"
          type="date"
          value={from}
          onChange={setFrom}
          message={fieldMessage(errors, 'from')}
        />
        <TextField
          label="Fim"
          name="to"
          type="date"
          value={to}
          onChange={setTo}
          message={fieldMessage(errors, 'to')}
        />
        <button type="submit">Atualizar</button>
      </form>

      {report ? (
        <>
          <h2>Membros</h2>
          {report.members.length === 0 ? <p>Ninguém serviu neste período.</p> : null}
          <ul className="list">
            {report.members.map((member) => (
              <li key={member.membershipId} className="card">
                <strong>{member.name}</strong>
                <p>
                  {member.schedules} {member.schedules === 1 ? 'escala' : 'escalas'}
                </p>
                <p>
                  {member.assignments} {member.assignments === 1 ? 'atribuição' : 'atribuições'}
                </p>
              </li>
            ))}
          </ul>

          <h2>Sem escala</h2>
          {report.idle.length === 0 ? <p>Todo mundo serviu neste período.</p> : null}
          <ul className="list">
            {report.idle.map((member) => (
              <li key={member.membershipId}>{member.name}</li>
            ))}
          </ul>

          <h2>Faltas</h2>
          {report.absences.length === 0 ? <p>Nenhuma falta neste período.</p> : null}
          <ul className="list">
            {report.absences.map((member) => (
              <li key={member.membershipId}>
                {member.name}: {member.count}
              </li>
            ))}
          </ul>

          <h2>Músicas</h2>
          {report.songs.length === 0 ? <p>Nenhuma música neste período.</p> : null}
          <ul className="list">
            {report.songs.map((song) => (
              <li key={`${song.title}-${song.artist ?? ''}`}>
                {song.title}
                {song.artist ? ` — ${song.artist}` : ''}: {song.count}
              </li>
            ))}
          </ul>

          <h2>Confirmações</h2>
          <p>
            {report.confirmations.pending} pendentes, {report.confirmations.confirmed} confirmadas,{' '}
            {report.confirmations.declined} recusadas
          </p>
        </>
      ) : null}

      <h2>Panorama</h2>
      <label className="field">
        <span>Mês</span>
        <input name="month" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        {fieldMessage(errors, 'month') ? <small>{fieldMessage(errors, 'month')}</small> : null}
      </label>
      {panorama && panorama.days.length === 0 ? <p>Nenhuma escala neste mês.</p> : null}
      {panorama && panorama.days.length > 0 ? (
        <div className="panorama">
          <table>
            <thead>
              <tr>
                <th>Função</th>
                {panorama.days.map((day) => (
                  <th key={day}>{day.slice(8)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {panorama.rows.map((row) => (
                <tr key={row.functionId}>
                  <th>{row.name}</th>
                  {row.cells.map((cell) => (
                    <td key={cell.date}>
                      {cell.people.map((person) => (
                        <p key={`${person.scheduleId}-${person.name}`}>
                          <Link to={`/m/${ministry.id}/escalas/${person.scheduleId}`}>{person.name}</Link>
                          {person.conflicts.length > 0 ? ` (${conflictLabel(person.conflicts)})` : ''}
                        </p>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

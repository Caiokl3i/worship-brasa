import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError } from '../lib/api.ts'
import { formatInZone, type ScheduleSummary } from '../lib/schedule.ts'

type TrashSong = {
  id: string
  title: string
  artist: string | null
}

export function LixeiraPage() {
  const { ministry } = useMinistry()
  const canSchedules = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const canSongs = ministry.membership.isAdmin || ministry.membership.canManageRepertoire
  const [schedules, setSchedules] = useState<ScheduleSummary[] | null>(null)
  const [songs, setSongs] = useState<TrashSong[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (canSchedules) {
      api<{ schedules: ScheduleSummary[] }>(`/api/ministerios/${ministry.id}/lixeira/escalas`)
        .then((body) => {
          if (!cancelled) {
            setSchedules(body.schedules)
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled && caught instanceof ApiError) {
            setError(caught.message)
          }
        })
    }
    if (canSongs && ministry.musicModuleEnabled) {
      api<{ songs: TrashSong[] }>(`/api/ministerios/${ministry.id}/lixeira/musicas`)
        .then((body) => {
          if (!cancelled) {
            setSongs(body.songs)
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled && caught instanceof ApiError) {
            setError(caught.message)
          }
        })
    }
    return () => {
      cancelled = true
    }
  }, [canSchedules, canSongs, ministry.id, ministry.musicModuleEnabled])

  async function restoreSchedule(scheduleId: string) {
    setError('')
    await api(`/api/ministerios/${ministry.id}/lixeira/escalas/${scheduleId}/restaurar`, {
      method: 'POST',
    })
    setSchedules((current) => current?.filter((item) => item.id !== scheduleId) ?? null)
  }

  async function restoreSong(songId: string) {
    setError('')
    await api(`/api/ministerios/${ministry.id}/lixeira/musicas/${songId}/restaurar`, {
      method: 'POST',
    })
    setSongs((current) => current?.filter((item) => item.id !== songId) ?? null)
  }

  if (!canSchedules && !canSongs) {
    return (
      <section>
        <h1>Lixeira</h1>
        <p>Você não pode fazer isso.</p>
        <p>
          <Link to="..">Voltar</Link>
        </p>
      </section>
    )
  }

  return (
    <section>
      <p className="eyebrow">Lixeira</p>
      <h1>{ministry.name}</h1>
      <p>Itens excluídos nos últimos 30 dias. Depois disso continuam ocultos.</p>
      {error ? <p className="errors">{error}</p> : null}
      {canSchedules ? (
        <>
          <h2>Escalas</h2>
          {schedules === null ? <p>Carregando…</p> : null}
          {schedules && schedules.length === 0 ? <p>Nenhuma escala na lixeira.</p> : null}
          <ul className="list">
            {schedules?.map((schedule) => (
              <li key={schedule.id} className="card">
                <strong>{schedule.title}</strong>
                <span>{formatInZone(schedule.startsAt, ministry.timezone)}</span>
                <button type="button" onClick={() => void restoreSchedule(schedule.id)}>
                  Restaurar
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {canSongs && ministry.musicModuleEnabled ? (
        <>
          <h2>Músicas</h2>
          {songs === null ? <p>Carregando…</p> : null}
          {songs && songs.length === 0 ? <p>Nenhuma música na lixeira.</p> : null}
          <ul className="list">
            {songs?.map((song) => (
              <li key={song.id} className="card">
                <strong>{song.title}</strong>
                {song.artist ? <span>{song.artist}</span> : null}
                <button type="button" onClick={() => void restoreSong(song.id)}>
                  Restaurar
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p>
        <Link to="..">Voltar</Link>
      </p>
    </section>
  )
}

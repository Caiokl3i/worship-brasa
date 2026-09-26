import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { MemberItem, MinistryFunctionItem } from '../lib/ministry.ts'
import type { SongDetail, SongSummary, SongVersionItem } from '../lib/repertoire.ts'
import {
  SONG_KEYS,
  toLocalInput,
  type ScheduleConflict,
  type ScheduleDetail,
  type ScheduleHighlight,
  type ScheduleLink,
} from '../lib/schedule.ts'

type Tab = 'dados' | 'equipe' | 'musicas'

type TeamMember = {
  membershipId: string
  name: string
  functions: Array<{ id: string; name: string }>
  confirmation: 'pending' | 'confirmed' | 'declined' | null
  absent: boolean | null
  conflicts: ScheduleConflict[]
}

type SongDraft = {
  songId: string
  title: string
  artist: string | null
  defaultKey: string | null
  versions: SongVersionItem[]
  versionId: string | null
  keyOverride: string
  notes: string
  durationSeconds: string
  highlights: ScheduleHighlight[]
  links: ScheduleLink[]
  effectiveKey: string
}

function originKey(song: SongDraft) {
  const version = song.versions.find((item) => item.id === song.versionId)
  return version?.key || song.defaultKey || ''
}

function shownKey(song: SongDraft) {
  return song.keyOverride || originKey(song) || song.effectiveKey
}

function confirmationLabel(confirmation: TeamMember['confirmation']) {
  if (confirmation === 'confirmed') {
    return 'Confirmado'
  }
  if (confirmation === 'declined') {
    return 'Não participarei'
  }
  if (confirmation === 'pending') {
    return 'Pendente'
  }
  return ''
}

function conflictLabels(conflicts: ScheduleConflict[]) {
  const labels: string[] = []
  if (conflicts.some((item) => item.kind === 'unavailability')) {
    labels.push('indisponível')
  }
  if (conflicts.some((item) => item.kind === 'schedule')) {
    labels.push('já escalado neste horário')
  }
  return labels
}

export function EscalaEditorPage() {
  const navigate = useNavigate()
  const params = useParams()
  const scheduleId = params.scheduleId ?? ''
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const canEditSongs = canManage || ministry.membership.canEditScheduleSongs
  const [tab, setTab] = useState<Tab>('dados')
  const [missing, setMissing] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [version, setVersion] = useState(1)
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [notes, setNotes] = useState('')
  const [dressCode, setDressCode] = useState('')
  const [confirmationRequired, setConfirmationRequired] = useState(true)
  const [startsAtIso, setStartsAtIso] = useState<string | null>(null)
  const [endsAtIso, setEndsAtIso] = useState<string | null>(null)
  const [team, setTeam] = useState<TeamMember[]>([])
  const [songs, setSongs] = useState<SongDraft[]>([])
  const [functions, setFunctions] = useState<MinistryFunctionItem[]>([])
  const [memberQuery, setMemberQuery] = useState('')
  const [memberHits, setMemberHits] = useState<MemberItem[]>([])
  const [hitConflicts, setHitConflicts] = useState<Record<string, ScheduleConflict[]>>({})
  const [pickedFunctions, setPickedFunctions] = useState<string[]>([])
  const [songQuery, setSongQuery] = useState('')
  const [songHits, setSongHits] = useState<SongSummary[]>([])
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')
  const [ready, setReady] = useState(false)

  function apply(detail: ScheduleDetail, catalog: Map<string, SongDetail>) {
    setStatus(detail.status)
    setVersion(detail.version)
    setTitle(detail.title)
    setStartsAt(toLocalInput(detail.startsAt, ministry.timezone))
    setEndsAt(toLocalInput(detail.endsAt, ministry.timezone))
    setNotes(detail.notes)
    setDressCode(detail.dressCode)
    setConfirmationRequired(detail.confirmationRequired)
    setStartsAtIso(detail.startsAt)
    setEndsAtIso(detail.endsAt)
    setTeam(
      detail.participants.map((participant) => ({
        membershipId: participant.membershipId,
        name: participant.name,
        functions: participant.functions.map((item) => ({ id: item.id, name: item.name })),
        confirmation: participant.confirmation,
        absent: participant.absent,
        conflicts: participant.conflicts,
      }))
    )
    setSongs(
      detail.songs.map((song) => {
        const full = catalog.get(song.songId)
        return {
          songId: song.songId,
          title: song.title,
          artist: song.artist,
          defaultKey: full?.defaultKey ?? null,
          versions:
            full?.versions ??
            (song.versionId
              ? [{ id: song.versionId, name: song.versionName ?? 'Versão', key: null }]
              : []),
          versionId: song.versionId,
          keyOverride: song.keyOverride ?? '',
          notes: song.notes,
          durationSeconds: song.durationSeconds ? String(song.durationSeconds) : '',
          highlights: song.highlights.filter(
            (highlight): highlight is ScheduleHighlight => highlight.membershipId !== null
          ),
          links: song.links,
          effectiveKey: song.effectiveKey,
        }
      })
    )
  }

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const detail = await api<ScheduleDetail>(
          `/api/ministerios/${ministry.id}/escalas/${scheduleId}`
        )
        const catalog = new Map<string, SongDetail>()
        if (canManage || ministry.membership.canEditScheduleSongs) {
          const ids = [...new Set(detail.songs.map((song) => song.songId))]
          const loaded = await Promise.all(
            ids.map(async (songId) => {
              try {
                return await api<SongDetail>(`/api/ministerios/${ministry.id}/musicas/${songId}`)
              } catch {
                return null
              }
            })
          )
          for (const song of loaded) {
            if (song) {
              catalog.set(song.id, song)
            }
          }
          const functionBody = await api<{ functions: MinistryFunctionItem[] }>(
            `/api/ministerios/${ministry.id}/funcoes`
          )
          if (!cancelled) {
            setFunctions(functionBody.functions)
          }
        }
        if (!cancelled) {
          apply(detail, catalog)
          setReady(true)
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        if (error instanceof ApiError && error.status === 404) {
          setMissing(error.message)
          return
        }
        throw error
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [ministry.id, ministry.membership.canEditScheduleSongs, scheduleId, canManage])

  function payload() {
    return {
      version,
      title,
      startsAt,
      endsAt: endsAt || null,
      notes,
      dressCode,
      ...(canManage ? { confirmationRequired } : {}),
      participants: team.map((member) => ({
        membershipId: member.membershipId,
        functionIds: member.functions.map((item) => item.id),
      })),
      songs: songs.map((song) => ({
        songId: song.songId,
        versionId: song.versionId,
        keyOverride: song.keyOverride || null,
        notes: song.notes,
        durationSeconds: song.durationSeconds ? Number(song.durationSeconds) : null,
        highlights: song.highlights.filter((highlight) =>
          team.some(
            (member) =>
              member.membershipId === highlight.membershipId &&
              member.functions.some((item) => item.id === highlight.functionId)
          )
        ),
      })),
    }
  }

  async function send(path: string, method: string) {
    setErrors([])
    setNotice('')
    try {
      const detail = await api<ScheduleDetail>(path, {
        method,
        body: JSON.stringify(payload()),
      })
      const catalog = new Map<string, SongDetail>()
      for (const song of songs) {
        catalog.set(song.songId, {
          id: song.songId,
          title: song.title,
          artist: song.artist,
          bpm: null,
          durationSeconds: null,
          defaultKey: song.defaultKey,
          folder: null,
          classification: null,
          versions: song.versions,
          links: [],
        })
      }
      apply(detail, catalog)
      setNotice(method === 'POST' && path.endsWith('/publicar') ? 'Escala publicada.' : 'Escala salva.')
      if (path.endsWith('/rascunho')) {
        setNotice('Escala em rascunho.')
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  async function searchMembers(event: React.FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (memberQuery.trim()) {
      params.set('q', memberQuery.trim())
    }
    const suffix = params.toString() ? `?${params.toString()}` : ''
    const body = await api<{ members: MemberItem[] }>(
      `/api/ministerios/${ministry.id}/membros${suffix}`
    )
    const hits = body.members.filter(
      (member) => !team.some((item) => item.membershipId === member.membershipId)
    )
    setMemberHits(hits)
    if (!startsAt || hits.length === 0) {
      setHitConflicts({})
      return
    }
    const checked = await api<{
      results: Array<{ membershipId: string; conflicts: ScheduleConflict[] }>
    }>(`/api/ministerios/${ministry.id}/conflitos`, {
      method: 'POST',
      body: JSON.stringify({
        startsAt,
        endsAt: endsAt || null,
        ignoreScheduleId: scheduleId,
        membershipIds: hits.map((member) => member.membershipId),
      }),
    })
    setHitConflicts(
      Object.fromEntries(checked.results.map((item) => [item.membershipId, item.conflicts]))
    )
  }

  function currentCatalog() {
    const catalog = new Map<string, SongDetail>()
    for (const song of songs) {
      catalog.set(song.songId, {
        id: song.songId,
        title: song.title,
        artist: song.artist,
        bpm: null,
        durationSeconds: null,
        defaultKey: song.defaultKey,
        folder: null,
        classification: null,
        versions: song.versions,
        links: [],
      })
    }
    return catalog
  }

  async function confirmAttendance(confirmation: 'confirmed' | 'declined') {
    setErrors([])
    setNotice('')
    try {
      const detail = await api<ScheduleDetail>(
        `/api/ministerios/${ministry.id}/escalas/${scheduleId}/confirmacao`,
        { method: 'POST', body: JSON.stringify({ confirmation }) }
      )
      apply(detail, currentCatalog())
      setNotice(confirmation === 'confirmed' ? 'Presença confirmada.' : 'Resposta registrada.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  async function toggleAbsence(member: TeamMember) {
    setErrors([])
    setNotice('')
    try {
      const detail = await api<ScheduleDetail>(
        `/api/ministerios/${ministry.id}/escalas/${scheduleId}/falta`,
        {
          method: 'POST',
          body: JSON.stringify({ membershipId: member.membershipId, absent: !member.absent }),
        }
      )
      apply(detail, currentCatalog())
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  async function removeUnavailablePeople() {
    setErrors([])
    setNotice('')
    try {
      const detail = await api<ScheduleDetail>(
        `/api/ministerios/${ministry.id}/escalas/${scheduleId}/remover-indisponiveis`,
        { method: 'POST', body: JSON.stringify({ version }) }
      )
      apply(detail, currentCatalog())
      setNotice('Indisponíveis removidos. Quem só está em outra escala permanece.')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  function addMember(member: MemberItem) {
    if (pickedFunctions.length === 0) {
      setErrors([{ field: 'functionIds', message: 'Escolha ao menos uma função.' }])
      return
    }
    setTeam((current) => [
      ...current,
      {
        membershipId: member.membershipId,
        name: member.name,
        functions: pickedFunctions.map((functionId) => ({
          id: functionId,
          name: functions.find((item) => item.id === functionId)?.name ?? 'Função',
        })),
        confirmation: 'pending',
        absent: false,
        conflicts: hitConflicts[member.membershipId] ?? [],
      },
    ])
    setMemberHits((current) => current.filter((item) => item.membershipId !== member.membershipId))
    setErrors([])
  }

  function clearTeam() {
    if (team.length === 0 || !window.confirm('Limpar toda a equipe?')) {
      return
    }
    setTeam([])
    setSongs((current) => current.map((song) => ({ ...song, highlights: [] })))
  }

  async function searchSongs(event: React.FormEvent) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (songQuery.trim()) {
      params.set('q', songQuery.trim())
    }
    const suffix = params.toString() ? `?${params.toString()}` : ''
    const body = await api<{ songs: SongSummary[] }>(`/api/ministerios/${ministry.id}/musicas${suffix}`)
    setSongHits(body.songs)
  }

  async function addSong(summary: SongSummary) {
    const detail = await api<SongDetail>(`/api/ministerios/${ministry.id}/musicas/${summary.id}`)
    setSongs((current) => [
      ...current,
      {
        songId: detail.id,
        title: detail.title,
        artist: detail.artist,
        defaultKey: detail.defaultKey,
        versions: detail.versions,
        versionId: detail.versions[0]?.id ?? null,
        keyOverride: '',
        notes: '',
        durationSeconds: '',
        highlights: [],
        links: detail.links
          .filter((link) => link.versionId === null || link.versionId === (detail.versions[0]?.id ?? null))
          .map((link) => ({ id: link.id, kind: link.kind, label: link.label, url: link.url })),
        effectiveKey: detail.versions[0]?.key || detail.defaultKey || '',
      },
    ])
  }

  function moveSong(index: number, direction: -1 | 1) {
    const next = index + direction
    if (next < 0 || next >= songs.length) {
      return
    }
    setSongs((current) => {
      const copy = [...current]
      const [item] = copy.splice(index, 1)
      copy.splice(next, 0, item)
      return copy
    })
  }

  function toggleHighlight(songIndex: number, highlight: ScheduleHighlight) {
    setSongs((current) =>
      current.map((song, index) => {
        if (index !== songIndex) {
          return song
        }
        const exists = song.highlights.some(
          (item) =>
            item.membershipId === highlight.membershipId && item.functionId === highlight.functionId
        )
        return {
          ...song,
          highlights: exists
            ? song.highlights.filter(
                (item) =>
                  item.membershipId !== highlight.membershipId || item.functionId !== highlight.functionId
              )
            : [...song.highlights, highlight],
        }
      })
    )
  }

  if (missing) {
    return (
      <section>
        <h1>{missing}</h1>
        <p>
          <Link to={`/m/${ministry.id}/escalas`}>Voltar</Link>
        </p>
      </section>
    )
  }

  if (!ready) {
    return <p>Carregando…</p>
  }

  const availableFunctions = functions.filter(
    (item) => !item.archived || team.some((member) => member.functions.some((fn) => fn.id === item.id))
  )
  const deadline = new Date(endsAtIso ?? startsAtIso ?? 0).getTime()
  const ended = Boolean(startsAtIso) && Date.now() >= deadline
  const mine = team.find((member) => member.membershipId === ministry.membership.id)
  const teamWarnings = team.flatMap((member) =>
    conflictLabels(member.conflicts).map((label) => `${member.name}: ${label}`)
  )

  return (
    <section>
      <p className="eyebrow">Escalas</p>
      <h1>{title || 'Escala'}</h1>
      <p className="badge">{status === 'draft' ? 'Rascunho' : 'Publicada'}</p>
      {mine && status === 'published' && confirmationRequired ? (
        <div className="row">
          <span>{confirmationLabel(mine.confirmation) || 'Pendente'}</span>
          <button type="button" onClick={() => void confirmAttendance('confirmed')}>
            Confirmar
          </button>
          <button type="button" onClick={() => void confirmAttendance('declined')}>
            Não participarei
          </button>
        </div>
      ) : null}
      {mine?.absent ? <p className="notice">Falta</p> : null}
      <div className="tabs" role="tablist">
        <button type="button" aria-selected={tab === 'dados'} onClick={() => setTab('dados')}>
          Dados
        </button>
        <button type="button" aria-selected={tab === 'equipe'} onClick={() => setTab('equipe')}>
          Equipe
        </button>
        <button type="button" aria-selected={tab === 'musicas'} onClick={() => setTab('musicas')}>
          Músicas
        </button>
      </div>
      <FieldErrors errors={errors} />
      {notice ? <p className="notice">{notice}</p> : null}

      {tab === 'dados' ? (
        <div className="form">
          <TextField
            label="Título"
            name="title"
            value={title}
            onChange={canManage ? setTitle : undefined}
            readOnly={!canManage}
            message={fieldMessage(errors, 'title')}
          />
          <TextField
            label="Início"
            name="startsAt"
            type="datetime-local"
            value={startsAt}
            onChange={canManage ? setStartsAt : undefined}
            readOnly={!canManage}
            message={fieldMessage(errors, 'startsAt')}
          />
          <TextField
            label="Término"
            name="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={canManage ? setEndsAt : undefined}
            readOnly={!canManage}
            message={fieldMessage(errors, 'endsAt')}
          />
          <label className="field">
            <span>Observações</span>
            <textarea
              name="notes"
              value={notes}
              readOnly={!canManage}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <TextField
            label="Vestimenta"
            name="dressCode"
            value={dressCode}
            onChange={canManage ? setDressCode : undefined}
            readOnly={!canManage}
          />
          {canManage ? (
            <label className="checks">
              <span>
                <input
                  type="checkbox"
                  checked={confirmationRequired}
                  onChange={(event) => setConfirmationRequired(event.target.checked)}
                />{' '}
                Pedir confirmação
              </span>
            </label>
          ) : null}
        </div>
      ) : null}

      {tab === 'equipe' ? (
        <div className="form">
          {teamWarnings.length > 0 ? (
            <p className="notice">
              Há avisos na equipe. Você ainda pode mantê-los nesta escala.{' '}
              {teamWarnings.join('. ')}.
            </p>
          ) : null}
          {team.length === 0 ? <p>Ninguém na equipe.</p> : null}
          <ul className="list">
            {team.map((member) => (
              <li key={member.membershipId} className="card">
                <strong>{member.name}</strong>
                <span>{member.functions.map((item) => item.name).join(', ')}</span>
                {confirmationLabel(member.confirmation) ? (
                  <span className="badge">{confirmationLabel(member.confirmation)}</span>
                ) : null}
                {member.absent ? <span className="badge">Falta</span> : null}
                {conflictLabels(member.conflicts).map((label) => (
                  <span key={label} className="badge">
                    {label}
                  </span>
                ))}
                {canManage && ended ? (
                  <button type="button" onClick={() => void toggleAbsence(member)}>
                    {member.absent ? 'Desmarcar falta' : 'Marcar falta'}
                  </button>
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    onClick={() =>
                      setTeam((current) =>
                        current.filter((item) => item.membershipId !== member.membershipId)
                      )
                    }
                  >
                    Remover
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
          {canManage ? (
            <>
              <form className="form" onSubmit={(event) => void searchMembers(event)}>
                <TextField
                  label="Buscar por nome"
                  name="memberQuery"
                  value={memberQuery}
                  onChange={setMemberQuery}
                />
                <button type="submit">Buscar</button>
              </form>
              <div className="checks">
                {availableFunctions
                  .filter((item) => !item.archived)
                  .map((item) => (
                    <label key={item.id}>
                      <input
                        type="checkbox"
                        checked={pickedFunctions.includes(item.id)}
                        onChange={() =>
                          setPickedFunctions((current) =>
                            current.includes(item.id)
                              ? current.filter((id) => id !== item.id)
                              : [...current, item.id]
                          )
                        }
                      />{' '}
                      {item.name}
                    </label>
                  ))}
              </div>
              {fieldMessage(errors, 'functionIds') ? (
                <small>{fieldMessage(errors, 'functionIds')}</small>
              ) : null}
              <ul className="list">
                {memberHits.map((member) => (
                  <li key={member.membershipId} className="card">
                    <span>{member.name}</span>
                    {conflictLabels(hitConflicts[member.membershipId] ?? []).map((label) => (
                      <span key={label} className="badge">
                        {label}
                      </span>
                    ))}
                    <button type="button" onClick={() => addMember(member)}>
                      Incluir
                    </button>
                  </li>
                ))}
              </ul>
              <div className="row">
                <button type="button" onClick={clearTeam}>
                  Limpar equipe
                </button>
                <button type="button" onClick={() => void removeUnavailablePeople()}>
                  Remover indisponíveis desta escala
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {tab === 'musicas' ? (
        <div className="form">
          {songs.length === 0 ? <p>Nenhuma música nesta escala.</p> : null}
          <ol className="list">
            {songs.map((song, index) => (
              <li key={`${song.songId}-${index}`} className="card">
                <strong>
                  {index + 1}. {song.title}
                </strong>
                <span>{song.artist}</span>
                <span>Tom neste dia: {shownKey(song) || '—'}</span>
                {canEditSongs ? (
                  <>
                    <label className="field">
                      <span>Versão</span>
                      <select
                        value={song.versionId ?? ''}
                        onChange={(event) => {
                          const versionId = event.target.value || null
                          setSongs((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, versionId } : item
                            )
                          )
                        }}
                      >
                        <option value="">Sem versão</option>
                        {song.versions.map((versionItem) => (
                          <option key={versionItem.id} value={versionItem.id}>
                            {versionItem.name}
                            {versionItem.key ? ` (${versionItem.key})` : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Tom da escala</span>
                      <select
                        value={song.keyOverride}
                        onChange={(event) =>
                          setSongs((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, keyOverride: event.target.value }
                                : item
                            )
                          )
                        }
                      >
                        <option value="">
                          {originKey(song) ? `Tom de origem (${originKey(song)})` : 'Tom de origem'}
                        </option>
                        {SONG_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Observação</span>
                      <textarea
                        value={song.notes}
                        onChange={(event) =>
                          setSongs((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, notes: event.target.value } : item
                            )
                          )
                        }
                      />
                    </label>
                    <div className="checks">
                      {team.flatMap((member) =>
                        member.functions.map((ministryFunction) => {
                          const highlight = {
                            membershipId: member.membershipId,
                            functionId: ministryFunction.id,
                          }
                          const checked = song.highlights.some(
                            (item) =>
                              item.membershipId === member.membershipId &&
                              item.functionId === ministryFunction.id
                          )
                          return (
                            <label key={`${member.membershipId}-${ministryFunction.id}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleHighlight(index, highlight)}
                              />{' '}
                              {member.name} — {ministryFunction.name}
                            </label>
                          )
                        })
                      )}
                    </div>
                    <div className="row">
                      <button type="button" onClick={() => moveSong(index, -1)}>
                        Subir
                      </button>
                      <button type="button" onClick={() => moveSong(index, 1)}>
                        Descer
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSongs((current) => current.filter((_, itemIndex) => itemIndex !== index))
                        }
                      >
                        Remover
                      </button>
                    </div>
                  </>
                ) : (
                  <span>{song.versionId ? song.versions[0]?.name : ''}</span>
                )}
                {song.links.length > 0 ? (
                  <span className="row">
                    {song.links.map((link) => (
                      <a key={link.id} href={link.url} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    ))}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          {canEditSongs ? (
            <form className="form" onSubmit={(event) => void searchSongs(event)}>
              <TextField
                label="Buscar no repertório"
                name="songQuery"
                value={songQuery}
                onChange={setSongQuery}
              />
              <button type="submit">Buscar</button>
              <ul className="list">
                {songHits.map((song) => (
                  <li key={song.id} className="card">
                    <span>
                      {song.title}
                      {song.artist ? ` — ${song.artist}` : ''}
                    </span>
                    <button type="button" onClick={() => void addSong(song)}>
                      Incluir
                    </button>
                  </li>
                ))}
              </ul>
            </form>
          ) : null}
        </div>
      ) : null}

      <div className="row">
        {canEditSongs ? (
          <button
            type="button"
            onClick={() => void send(`/api/ministerios/${ministry.id}/escalas/${scheduleId}`, 'PATCH')}
          >
            Salvar
          </button>
        ) : null}
        {canManage && status === 'draft' ? (
          <button
            type="button"
            onClick={() =>
              void send(`/api/ministerios/${ministry.id}/escalas/${scheduleId}/publicar`, 'POST')
            }
          >
            Publicar
          </button>
        ) : null}
        {canManage && status === 'published' ? (
          <button
            type="button"
            onClick={() =>
              void send(`/api/ministerios/${ministry.id}/escalas/${scheduleId}/rascunho`, 'POST')
            }
          >
            Voltar a rascunho
          </button>
        ) : null}
        {canManage ? (
          <button
            type="button"
            onClick={() => {
              if (!window.confirm('Excluir esta escala?')) {
                return
              }
              void api(`/api/ministerios/${ministry.id}/escalas/${scheduleId}`, {
                method: 'DELETE',
              }).then(() => navigate(`/m/${ministry.id}/escalas`))
            }}
          >
            Excluir
          </button>
        ) : null}
        <Link to={`/m/${ministry.id}/escalas`}>Voltar</Link>
      </div>
    </section>
  )
}

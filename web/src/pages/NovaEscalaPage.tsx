import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { Icon } from '../components/Icon.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { functionIcon } from '../lib/function_icon.ts'
import type { MemberItem, MinistryFunctionItem } from '../lib/ministry.ts'
import type { SongSummary } from '../lib/repertoire.ts'
import type { ScheduleDetail } from '../lib/schedule.ts'
import { useSession } from '../session.tsx'

type Tab = 'detalhes' | 'participantes' | 'musicas' | 'roteiro'
type RepeatMode = 'none' | 'weekly' | 'monthly'
type MemberView = 'all' | 'selected' | 'functions'

type DraftPerson = {
  membershipId: string
  name: string
  functionIds: string[]
}

const NOTES_LIMIT = 500

function weekdayOf(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }
  const jsWeekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return jsWeekday === 0 ? 7 : jsWeekday
}

function zonedNow(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return {
    date: `${read('year')}-${read('month')}-${read('day')}`,
    time: `${read('hour')}:${read('minute')}`,
  }
}

const PALETTE = [
  { id: 'blue', name: 'Azul', color: '#4c94f5' },
  { id: 'green', name: 'Verde', color: '#3dbe7a' },
  { id: 'yellow', name: 'Amarelo', color: '#e2b340' },
  { id: 'orange', name: 'Laranja', color: '#e07a3d' },
  { id: 'red', name: 'Vermelho', color: '#e05a5a' },
  { id: 'purple', name: 'Roxo', color: '#8b6adf' },
  { id: 'pink', name: 'Rosa', color: '#d86aa8' },
] as const

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function prettyDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) {
    return 'Data'
  }
  const utc = new Date(Date.UTC(year, month - 1, day))
  const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' })
    .format(utc)
    .split('-')[0]
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(utc)
    .replace('.', '')
  const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)
  return `${label(weekday)} ${day} ${label(monthName)}`
}

export function NovaEscalaPage() {
  const navigate = useNavigate()
  const { ministry } = useMinistry()
  const { user } = useSession()
  const now = useMemo(() => zonedNow(ministry.timezone), [ministry.timezone])
  const [tab, setTab] = useState<Tab>('detalhes')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(now.date)
  const [time, setTime] = useState(now.time)
  const [repeat, setRepeat] = useState<RepeatMode>('none')
  const [notes, setNotes] = useState('')
  const [publish, setPublish] = useState(true)
  const [confirmationRequired, setConfirmationRequired] = useState(true)
  const [people, setPeople] = useState<DraftPerson[]>([])
  const [memberDraft, setMemberDraft] = useState<DraftPerson[] | null>(null)
  const [memberQuery, setMemberQuery] = useState('')
  const [memberView, setMemberView] = useState<MemberView>('all')
  const [functionFilters, setFunctionFilters] = useState<string[]>([])
  const [openAssign, setOpenAssign] = useState<string | null>(null)
  const [members, setMembers] = useState<MemberItem[]>([])
  const [functions, setFunctions] = useState<MinistryFunctionItem[]>([])
  const [picker, setPicker] = useState<'people' | 'songs' | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [paletteId, setPaletteId] = useState<string | null>(null)
  const [songs, setSongs] = useState<SongSummary[]>([])
  const [catalog, setCatalog] = useState<SongSummary[] | null>(null)
  const [songQuery, setSongQuery] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void api<{ members: MemberItem[] }>(`/api/ministerios/${ministry.id}/membros`).then((body) => {
      setMembers(body.members)
      const mine = body.members.find((member) => member.membershipId === ministry.membership.id)
      if (mine) {
        setPeople([{ membershipId: mine.membershipId, name: mine.name, functionIds: [] }])
      } else if (user) {
        setPeople([{ membershipId: ministry.membership.id, name: user.name, functionIds: [] }])
      }
    })
    void api<{ functions: MinistryFunctionItem[] }>(`/api/ministerios/${ministry.id}/funcoes`).then(
      (body) => setFunctions(body.functions.filter((item) => !item.archived))
    )
  }, [ministry.id, ministry.membership.id, user])

  useEffect(() => {
    if (!ministry.musicModuleEnabled || catalog) {
      return
    }
    void api<{ songs: SongSummary[] }>(`/api/ministerios/${ministry.id}/musicas`).then((body) =>
      setCatalog(body.songs)
    )
  }, [catalog, ministry.id, ministry.musicModuleEnabled])

  function functionName(id: string) {
    return functions.find((item) => item.id === id)?.name ?? ''
  }

  function openMembers() {
    setMemberDraft(people.map((person) => ({ ...person, functionIds: [...person.functionIds] })))
    setMemberQuery('')
    setMemberView('all')
    setFunctionFilters([])
    setOpenAssign(null)
  }

  function draftPerson(membershipId: string) {
    return memberDraft?.find((person) => person.membershipId === membershipId) ?? null
  }

  function toggleMember(member: MemberItem) {
    setMemberDraft((current) => {
      const list = current ?? []
      if (list.some((person) => person.membershipId === member.membershipId)) {
        return list.filter((person) => person.membershipId !== member.membershipId)
      }
      return [...list, { membershipId: member.membershipId, name: member.name, functionIds: [] }]
    })
  }

  function toggleDraftFunction(member: MemberItem, functionId: string) {
    setMemberDraft((current) => {
      const list = current ?? []
      const person = list.find((item) => item.membershipId === member.membershipId)
      if (!person) {
        return [...list, { membershipId: member.membershipId, name: member.name, functionIds: [functionId] }]
      }
      const has = person.functionIds.includes(functionId)
      return list.map((item) =>
        item.membershipId === member.membershipId
          ? {
              ...item,
              functionIds: has
                ? item.functionIds.filter((id) => id !== functionId)
                : [...item.functionIds, functionId],
            }
          : item
      )
    })
  }

  const filteredSongs = (catalog ?? []).filter((song) => {
    const term = songQuery.trim().toLowerCase()
    if (!term) {
      return true
    }
    return (
      song.title.toLowerCase().includes(term) || (song.artist ?? '').toLowerCase().includes(term)
    )
  })

  async function submit() {
    setErrors([])
    const missing = people.find((person) => person.functionIds.length === 0)
    if (missing) {
      setTab('participantes')
      setErrors([{ field: 'participants', message: `Escolha a função de ${missing.name}.` }])
      return
    }
    const startsAt = `${date}T${time}`
    const day = weekdayOf(date)
    setSaving(true)
    try {
      const created = await api<ScheduleDetail>(`/api/ministerios/${ministry.id}/escalas`, {
        method: 'POST',
        body: JSON.stringify({
          title,
          startsAt,
          endsAt: null,
          notes,
          dressCode: '',
          confirmationRequired,
          ...(repeat === 'none'
            ? {}
            : {
                repeat: {
                  frequency: repeat,
                  interval: 1,
                  weekdays: repeat === 'weekly' && day ? [day] : [],
                  endsMode: 'never',
                  endsOn: null,
                  occurrenceCount: null,
                },
              }),
        }),
      })
      const payload = {
        title,
        startsAt,
        endsAt: null,
        notes,
        dressCode: '',
        confirmationRequired,
        version: created.version,
        participants: people.map((person) => ({
          membershipId: person.membershipId,
          functionIds: person.functionIds,
        })),
        songs: songs.map((song) => ({
          songId: song.id,
          versionId: null,
          keyOverride: null,
          notes: '',
          durationSeconds: song.durationSeconds,
          highlights: [],
        })),
      }
      const path = publish
        ? `/api/ministerios/${ministry.id}/escalas/${created.id}/publicar`
        : `/api/ministerios/${ministry.id}/escalas/${created.id}`
      await api(path, { method: publish ? 'POST' : 'PATCH', body: JSON.stringify(payload) })
      navigate(`/m/${ministry.id}/escalas/${created.id}`, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        if (error.errors.some((item) => item.field === 'title' || item.field === 'startsAt')) {
          setTab('detalhes')
        }
        return
      }
      throw error
    } finally {
      setSaving(false)
    }
  }

  const paletteName = PALETTE.find((item) => item.id === paletteId)?.name ?? 'Nenhuma'

  if (memberDraft) {
    const term = memberQuery.trim().toLowerCase()
    const listed = members.filter((member) => {
      const selected = memberDraft.some((person) => person.membershipId === member.membershipId)
      if (memberView === 'selected' && !selected) {
        return false
      }
      if (
        functionFilters.length > 0 &&
        !member.functions.some((item) => functionFilters.includes(item.id))
      ) {
        return false
      }
      if (!term) {
        return true
      }
      const assigned = draftPerson(member.membershipId)
        ?.functionIds.map(functionName)
        .join(' ')
      const profile = member.functions.map((item) => item.name).join(' ')
      return `${member.name} ${profile} ${assigned ?? ''}`.toLowerCase().includes(term)
    })
    const allListedOn = listed.length > 0 && listed.every((member) => draftPerson(member.membershipId))

    return (
      <section className="page notice-screen member-pick-screen">
        <header className="notice-top">
          <button type="button" className="notice-icon-button" aria-label="Fechar" onClick={() => setMemberDraft(null)}>
            <Icon name="x" size={20} />
          </button>
          <div className="notice-top-title">
            <h1>Membros</h1>
          </div>
          <span />
        </header>

        <label className="member-pick-search">
          <Icon name="search" size={16} />
          <input
            value={memberQuery}
            placeholder="Buscar por nome ou função"
            aria-label="Buscar por nome ou função"
            onChange={(event) => setMemberQuery(event.target.value)}
          />
        </label>

        <div className="member-pick-tools">
          <label>
            <input
              type="checkbox"
              checked={allListedOn}
              onChange={() => {
                setMemberDraft((current) => {
                  const list = current ?? []
                  if (allListedOn) {
                    const hide = new Set(listed.map((member) => member.membershipId))
                    return list.filter((person) => !hide.has(person.membershipId))
                  }
                  const next = [...list]
                  for (const member of listed) {
                    if (!next.some((person) => person.membershipId === member.membershipId)) {
                      next.push({ membershipId: member.membershipId, name: member.name, functionIds: [] })
                    }
                  }
                  return next
                })
              }}
            />
            Selecionar todos
          </label>
          <button type="button" onClick={() => setMemberDraft([])}>
            Limpar
          </button>
        </div>

        <div className="segment member-pick-segment">
          <button type="button" aria-selected={memberView === 'all'} onClick={() => setMemberView('all')}>
            Todos ({members.length})
          </button>
          <button type="button" aria-selected={memberView === 'selected'} onClick={() => setMemberView('selected')}>
            Selecionados ({memberDraft.length})
          </button>
          <button type="button" aria-selected={memberView === 'functions'} onClick={() => setMemberView('functions')}>
            Funções ({functionFilters.length})
          </button>
        </div>

        {memberView === 'functions' ? (
          <div className="member-function-filters">
            {functions.map((item) => (
              <button
                key={item.id}
                type="button"
                className={functionFilters.includes(item.id) ? 'is-on' : ''}
                onClick={() =>
                  setFunctionFilters((current) =>
                    current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
                  )
                }
              >
                {functionIcon(item.name)} {item.name}
              </button>
            ))}
          </div>
        ) : null}

        <ul className="member-pick-list">
          {listed.map((member) => {
            const person = draftPerson(member.membershipId)
            const ownFunctions = member.functions.filter((item) => !item.archived)
            const profile = ownFunctions.map((item) => item.name)
            const opened = openAssign === member.membershipId
            return (
              <li key={member.membershipId} className="member-pick-card">
                <div className="member-pick-main">
                  <button
                    type="button"
                    className="member-pick-open"
                    aria-expanded={opened}
                    onClick={() =>
                      setOpenAssign((current) => (current === member.membershipId ? null : member.membershipId))
                    }
                  >
                    <span className="member-avatar" aria-hidden="true">
                      {initials(member.name)}
                    </span>
                    <span>
                      <strong>{member.name}</strong>
                      <em>{profile.length > 0 ? profile.join(', ') : 'Nenhuma função selecionada.'}</em>
                      {member.everScheduled === false ? <small>Nunca escalado</small> : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="setup-switch"
                    role="switch"
                    aria-checked={Boolean(person)}
                    aria-label={`Incluir ${member.name}`}
                    onClick={() => toggleMember(member)}
                  />
                </div>
                {opened ? (
                  ownFunctions.length > 0 ? (
                    <div className="schedule-function-picks">
                      {ownFunctions.map((item) => (
                        <label key={item.id}>
                          <input
                            type="checkbox"
                            checked={person?.functionIds.includes(item.id) ?? false}
                            onChange={() => toggleDraftFunction(member, item.id)}
                          />
                          {functionIcon(item.name)} {item.name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="member-assign">Nenhuma função atribuída.</p>
                  )
                ) : null}
              </li>
            )
          })}
        </ul>

        <footer className="member-pick-foot">
          <span>
            {memberDraft.length} participante{memberDraft.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            className="notice-save"
            onClick={() => {
              setPeople(memberDraft)
              setMemberDraft(null)
            }}
          >
            <Icon name="check" size={16} /> Salvar
          </button>
        </footer>
      </section>
    )
  }

  return (
    <section className="page notice-screen schedule-create">
      <header className="notice-top">
        <Link className="notice-icon-button" to={`/m/${ministry.id}/escalas`} aria-label="Voltar">
          <Icon name="chevron-right" size={20} className="notice-back-icon" />
        </Link>
        <div className="notice-top-title">
          <h1>Nova escala</h1>
        </div>
        <span />
      </header>

      <div className="schedule-tabs" role="tablist">
        {(
          [
            ['detalhes', 'Detalhes', 'clock'],
            ['participantes', 'Participantes', 'users'],
            ...(ministry.musicModuleEnabled ? [['musicas', 'Músicas', 'music'] as const] : []),
            ['roteiro', 'Roteiro', 'scripts'],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            type="button"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            <Icon name={icon} size={16} />
            <span>{label}</span>
            {id === 'participantes' ? <em>{people.length}</em> : null}
            {id === 'musicas' ? <em>{songs.length}</em> : null}
            {id === 'roteiro' ? <em>0</em> : null}
          </button>
        ))}
      </div>

      <FieldErrors errors={errors} />

      {tab === 'detalhes' ? (
        <div className="schedule-create-form">
          <label className="schedule-title-field">
            <span>T</span>
            <input
              value={title}
              placeholder="Título da escala"
              aria-label="Título da escala"
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>
          {fieldMessage(errors, 'title') ? (
            <small className="field-error-msg">{fieldMessage(errors, 'title')}</small>
          ) : null}
          <div className="schedule-when">
            <label>
              <span>Data</span>
              <Icon name="calendar" size={16} />
              <input type="date" value={date} aria-label="Data" onChange={(event) => setDate(event.target.value)} />
              <strong>{prettyDate(date)}</strong>
            </label>
            <label>
              <span>Hora</span>
              <Icon name="clock" size={16} />
              <input type="time" value={time} aria-label="Hora" onChange={(event) => setTime(event.target.value)} />
              <strong>{time}</strong>
            </label>
          </div>
          {fieldMessage(errors, 'startsAt') ? (
            <small className="field-error-msg">{fieldMessage(errors, 'startsAt')}</small>
          ) : null}
          <label className="schedule-repeat">
            <span>Repetir</span>
            <Icon name="calendar" size={16} />
            <select
              value={repeat}
              aria-label="Repetir"
              onChange={(event) => setRepeat(event.target.value as RepeatMode)}
            >
              <option value="none">Não se repete</option>
              <option value="weekly">Toda semana</option>
              <option value="monthly">Todo mês</option>
            </select>
          </label>
          <label className="notice-field schedule-notes">
            <textarea
              value={notes}
              maxLength={NOTES_LIMIT}
              placeholder="Observações"
              aria-label="Observações"
              onChange={(event) => setNotes(event.target.value)}
            />
            <span>
              {notes.length}/{NOTES_LIMIT}
            </span>
          </label>

          <div className="notice-toggle schedule-switch-card">
            <Icon name="eye" size={18} className="schedule-switch-icon" />
            <span>
              <strong>Publicar escala</strong>
              <span>Visível para todos os membros</span>
            </span>
            <button
              type="button"
              className="setup-switch"
              role="switch"
              aria-checked={publish}
              aria-label="Publicar escala"
              onClick={() => setPublish((value) => !value)}
            />
          </div>
          <div className="notice-toggle schedule-switch-card">
            <Icon name="user-check" size={18} className="schedule-switch-icon" />
            <span>
              <strong>Pedir confirmação</strong>
              <span>Participantes confirmam presença</span>
            </span>
            <button
              type="button"
              className="setup-switch"
              role="switch"
              aria-checked={confirmationRequired}
              aria-label="Pedir confirmação"
              onClick={() => setConfirmationRequired((value) => !value)}
            />
          </div>
          <button type="button" className="schedule-link-row" onClick={() => setPaletteOpen(true)}>
            <Icon name="user" size={18} />
            <span>Paleta de cores</span>
            <em>{paletteName}</em>
            <Icon name="chevron-right" size={16} />
          </button>
          <button type="button" className="schedule-link-row" onClick={() => setTab('roteiro')}>
            <Icon name="clock" size={18} />
            <span>Roteiro</span>
            <em>0 itens</em>
            <Icon name="chevron-right" size={16} />
          </button>
        </div>
      ) : null}

      {tab === 'participantes' ? (
        <div className="schedule-create-form">
          <div className="schedule-inline-actions">
            <button type="button" onClick={openMembers}>
              <Icon name="pencil" size={14} /> Editar
            </button>
            <button type="button" onClick={() => setPicker('people')}>
              <Icon name="plus" size={14} /> Adicionar
            </button>
            <button type="button" onClick={() => setPeople([])}>
              Limpar
            </button>
          </div>
          {fieldMessage(errors, 'participants') ? (
            <small className="field-error-msg">{fieldMessage(errors, 'participants')}</small>
          ) : null}
          {people.length === 0 ? <p className="notice-hint">Ninguém nesta escala.</p> : null}
          <ul className="schedule-people">
            {people.map((person) => {
              const names = person.functionIds.map(functionName).filter(Boolean)
              return (
                <li key={person.membershipId}>
                  <span className="schedule-person-icon" aria-hidden="true">
                    {names[0] ? functionIcon(names[0]) : '👤'}
                  </span>
                  <span>
                    <strong>{person.name}</strong>
                    <em>{names.length > 0 ? names.join(', ') : 'Nenhuma função atribuída.'}</em>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {tab === 'musicas' ? (
        <div className="schedule-create-form">
          <div className="schedule-inline-actions">
            <button type="button" onClick={() => setPicker('songs')}>
              <Icon name="plus" size={14} /> Adicionar
            </button>
          </div>
          {songs.length === 0 ? (
            <div className="schedule-song-empty">
              <p>Para adicionar uma música, toque no botão:</p>
              <p>( + Adicionar )</p>
              {catalog && catalog.length === 0 ? (
                <p>
                  O repertório está vazio.{' '}
                  <Link to={`/m/${ministry.id}/repertorio/nova`}>Cadastre a música no repertório</Link>.
                </p>
              ) : null}
            </div>
          ) : (
            <ul className="schedule-people">
              {songs.map((song) => (
                <li key={song.id}>
                  <span className="schedule-person-icon" aria-hidden="true">
                    🎵
                  </span>
                  <span>
                    <strong>{song.title}</strong>
                    <em>{song.artist || song.defaultKey || 'Repertório'}</em>
                  </span>
                  <button
                    type="button"
                    aria-label={`Remover ${song.title}`}
                    onClick={() => setSongs((current) => current.filter((item) => item.id !== song.id))}
                  >
                    <Icon name="x" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {tab === 'roteiro' ? (
        <div className="schedule-song-empty">
          <p>O roteiro é montado depois que a escala é salva.</p>
        </div>
      ) : null}

      <button type="button" className="notice-save" disabled={saving} onClick={() => void submit()}>
        <Icon name="check" size={16} /> {saving ? 'Salvando…' : 'Salvar'}
      </button>

      {paletteOpen ? (
        <div className="model-dialog-layer" onMouseDown={() => setPaletteOpen(false)}>
          <div
            className="model-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="palette-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="model-dialog-head">
              <h2 id="palette-title">Paleta de cores</h2>
              <button type="button" className="model-dialog-close" aria-label="Fechar" onClick={() => setPaletteOpen(false)}>
                <Icon name="x" size={18} />
              </button>
            </header>
            <ul className="model-dialog-list">
              <li>
                <button
                  type="button"
                  className="model-option"
                  onClick={() => {
                    setPaletteId(null)
                    setPaletteOpen(false)
                  }}
                >
                  <span className="schedule-swatch" />
                  <span className="model-option-copy">
                    <strong>Nenhuma</strong>
                  </span>
                  {paletteId === null ? <Icon name="check" size={16} /> : null}
                </button>
              </li>
              {PALETTE.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="model-option"
                    onClick={() => {
                      setPaletteId(item.id)
                      setPaletteOpen(false)
                    }}
                  >
                    <span className="schedule-swatch" style={{ background: item.color }} />
                    <span className="model-option-copy">
                      <strong>{item.name}</strong>
                    </span>
                    {paletteId === item.id ? <Icon name="check" size={16} /> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {picker ? (
        <div className="model-dialog-layer" onMouseDown={() => setPicker(null)}>
          <div
            className="model-dialog schedule-picker"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="model-dialog-head">
              <h2>{picker === 'people' ? 'Adicionar participante' : 'Repertório'}</h2>
              <button type="button" className="model-dialog-close" aria-label="Fechar" onClick={() => setPicker(null)}>
                <Icon name="x" size={18} />
              </button>
            </header>
            {picker === 'songs' ? (
              <label className="schedule-song-search">
                <input
                  value={songQuery}
                  placeholder="Título ou artista"
                  aria-label="Título ou artista"
                  onChange={(event) => setSongQuery(event.target.value)}
                />
              </label>
            ) : null}
            <ul className="model-dialog-list">
              {picker === 'people'
                ? members
                    .filter((member) => !people.some((person) => person.membershipId === member.membershipId))
                    .map((member) => (
                      <li key={member.membershipId}>
                        <button
                          type="button"
                          className="model-option"
                          onClick={() => {
                            setPeople((current) => [
                              ...current,
                              { membershipId: member.membershipId, name: member.name, functionIds: [] },
                            ])
                            setEditingId(member.membershipId)
                            setPicker(null)
                          }}
                        >
                          <span className="schedule-person-icon">👤</span>
                          <span className="model-option-copy">
                            <strong>{member.name}</strong>
                          </span>
                        </button>
                      </li>
                    ))
                : null}
              {picker === 'songs' && catalog && catalog.length === 0 ? (
                <li className="schedule-song-empty">
                  <p>Lista vazia.</p>
                  <p>
                    Para adicionar uma música, cadastre no{' '}
                    <Link to={`/m/${ministry.id}/repertorio/nova`}>repertório</Link>.
                  </p>
                </li>
              ) : null}
              {picker === 'songs'
                ? filteredSongs
                    .filter((song) => !songs.some((item) => item.id === song.id))
                    .map((song) => (
                      <li key={song.id}>
                        <button
                          type="button"
                          className="model-option"
                          onClick={() => {
                            setSongs((current) => [...current, song])
                            setPicker(null)
                            setSongQuery('')
                          }}
                        >
                          <span className="schedule-person-icon">🎵</span>
                          <span className="model-option-copy">
                            <strong>{song.title}</strong>
                            <span>{song.artist || 'Sem artista'}</span>
                          </span>
                        </button>
                      </li>
                    ))
                : null}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  )
}

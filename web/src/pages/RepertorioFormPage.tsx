import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { Icon } from '../components/Icon.tsx'
import { TextField } from '../components/TextField.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import {
  LINK_KINDS,
  SONG_KEYS,
  type ClassificationItem,
  type FolderItem,
  type LinkKind,
  type SongDetail,
} from '../lib/repertoire.ts'
import { bpmFromIntervals, intervalsFromTaps } from '../lib/tempo.ts'

type VersionDraft = { name: string; key: string }
type LinkDraft = { versionIndex: number | null; kind: LinkKind; label: string; url: string }

const emptyVersion = (): VersionDraft => ({ name: '', key: '' })
const emptyLink = (): LinkDraft => ({ versionIndex: null, kind: 'cifra', label: '', url: '' })

type VersionForm = {
  name: string
  classificationId: string
  notes: string
  key: string
  bpm: string
  hours: string
  minutes: string
  seconds: string
  links: LinkDraft[]
}

function blankVersionForm(): VersionForm {
  return {
    name: '',
    classificationId: '',
    notes: '',
    key: '',
    bpm: '',
    hours: '',
    minutes: '',
    seconds: '',
    links: [
      { versionIndex: null, kind: 'letra', label: 'Letra', url: '' },
      { versionIndex: null, kind: 'cifra', label: 'Cifra', url: '' },
      { versionIndex: null, kind: 'audio', label: 'Áudio', url: '' },
      { versionIndex: null, kind: 'video', label: 'Vídeo', url: '' },
    ],
  }
}

const PLATFORMS = [
  { name: 'Spotify', host: 'spotify.com', search: (query: string) => `https://open.spotify.com/search/${query}` },
  { name: 'Letras', host: 'letras.mus.br', search: (query: string) => `https://www.letras.mus.br/?q=${query}` },
  { name: 'Cifra Club', host: 'cifraclub.com.br', search: (query: string) => `https://www.cifraclub.com.br/?q=${query}` },
  { name: 'YouTube', host: 'youtu', search: (query: string) => `https://www.youtube.com/results?search_query=${query}` },
  { name: 'Deezer', host: 'deezer.com', search: (query: string) => `https://www.deezer.com/search/${query}` },
  { name: 'Amazon Music', host: 'amazon.', search: (query: string) => `https://music.amazon.com/search/${query}` },
  { name: 'Apple Music', host: 'music.apple.com', search: (query: string) => `https://music.apple.com/search?term=${query}` },
  { name: 'SoundCloud', host: 'soundcloud.com', search: (query: string) => `https://soundcloud.com/search?q=${query}` },
]

const REFERENCE_ORDER = ['letra', 'cifra', 'audio', 'video', 'custom']

function coverHue(title: string) {
  let hash = 0
  for (const char of title) {
    hash = (hash + char.charCodeAt(0) * 17) % 360
  }
  return hash
}

function clockLabel(hours: string, minutes: string, seconds: string) {
  if (hours.trim() === '' && minutes.trim() === '' && seconds.trim() === '') {
    return '—'
  }
  const total = Number(hours || 0) * 3600 + Number(minutes || 0) * 60 + Number(seconds || 0)
  if (!total) {
    return '—'
  }
  const wholeHours = Math.floor(total / 3600)
  const wholeMinutes = Math.floor((total % 3600) / 60)
  const wholeSeconds = total % 60
  const clock = `${wholeMinutes}:${String(wholeSeconds).padStart(2, '0')}`
  return wholeHours > 0 ? `${wholeHours}:${String(wholeMinutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}` : clock
}

function storedKind(kind: string): LinkKind {
  if (kind === 'youtube') {
    return 'video'
  }
  if (LINK_KINDS.some((item) => item.value === kind)) {
    return kind as LinkKind
  }
  return 'custom'
}

function referenceGroup(kind: string, url: string) {
  if (kind === 'youtube' || /youtu\.?be/.test(url)) {
    return 'video'
  }
  if (kind === 'letra' || kind === 'cifra' || kind === 'audio' || kind === 'video') {
    return kind
  }
  return 'custom'
}

export function RepertorioFormPage() {
  const navigate = useNavigate()
  const params = useParams()
  const songId = params.songId
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageRepertoire
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [notes, setNotes] = useState('')
  const [openCard, setOpenCard] = useState<'original' | number | null>(null)
  const [defaultKey, setDefaultKey] = useState('')
  const [bpm, setBpm] = useState('')
  const [taps, setTaps] = useState<number[]>([])
  const [tempo, setTempo] = useState<number | null>(null)
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
  const [originalName, setOriginalName] = useState('Original')
  const [draft, setDraft] = useState<VersionForm | null>(null)
  const [classificationId, setClassificationId] = useState('')
  const [folderId, setFolderId] = useState('')
  const [versions, setVersions] = useState<VersionDraft[]>([])
  const [links, setLinks] = useState<LinkDraft[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [classifications, setClassifications] = useState<ClassificationItem[]>([])
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')
  const [missing, setMissing] = useState(false)
  const [ready, setReady] = useState(!songId)
  const [editing, setEditing] = useState(!songId)

  useEffect(() => {
    let active = true

    async function load() {
      const [folderBody, classificationBody] = await Promise.all([
        api<{ folders: FolderItem[] }>(`/api/ministerios/${ministry.id}/pastas`),
        api<{ classifications: ClassificationItem[] }>(
          `/api/ministerios/${ministry.id}/classificacoes`
        ),
      ])
      if (!active) {
        return
      }
      setFolders(folderBody.folders)
      setClassifications(classificationBody.classifications)

      if (!songId) {
        setReady(true)
        return
      }

      try {
        const song = await api<SongDetail>(`/api/ministerios/${ministry.id}/musicas/${songId}`)
        if (!active) {
          return
        }
        setTitle(song.title)
        setArtist(song.artist ?? '')
        setNotes(song.notes ?? '')
        setDefaultKey(song.defaultKey ?? '')
        setBpm(song.bpm === null ? '' : String(song.bpm))
        setHours(
          song.durationSeconds === null ? '' : String(Math.floor(song.durationSeconds / 3600))
        )
        setMinutes(
          song.durationSeconds === null
            ? ''
            : String(Math.floor((song.durationSeconds % 3600) / 60))
        )
        setSeconds(song.durationSeconds === null ? '' : String(song.durationSeconds % 60))
        setClassificationId(song.classification?.id ?? '')
        setFolderId(song.folder?.id ?? '')
        setVersions(
          song.versions.map((version) => ({ name: version.name, key: version.key ?? '' }))
        )
        setLinks(
          song.links.map((link) => {
            const versionIndex = link.versionId
              ? song.versions.findIndex((version) => version.id === link.versionId)
              : -1
            return {
              versionIndex: versionIndex >= 0 ? versionIndex : null,
              kind: storedKind(link.kind),
              label: link.label,
              url: link.url,
            }
          })
        )
        setMissing(false)
        setReady(true)
      } catch (error) {
        if (!active) {
          return
        }
        if (error instanceof ApiError && error.status === 404) {
          setMissing(true)
          setReady(true)
          return
        }
        throw error
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [ministry.id, songId])

  function durationSeconds() {
    if (hours.trim() === '' && minutes.trim() === '' && seconds.trim() === '') {
      return null
    }
    const total = Number(hours || 0) * 3600 + Number(minutes || 0) * 60 + Number(seconds || 0)
    return total > 0 ? total : null
  }

  function payload() {
    return {
      title,
      artist: artist.trim() || null,
      notes: notes.trim() || null,
      bpm: bpm.trim() === '' ? null : Number(bpm),
      durationSeconds: durationSeconds(),
      defaultKey: defaultKey || null,
      classificationId: classificationId || null,
      folderId: folderId || null,
      versions: versions.map((version) => ({
        name: version.name,
        key: version.key || null,
      })),
      links: links.filter((link) => link.url.trim()).map((link) => ({
        versionIndex: link.versionIndex,
        kind: link.kind,
        label: link.label,
        url: link.url,
      })),
    }
  }

  async function save(
    event: React.FormEvent,
    stay = false,
    next?: { versions: VersionDraft[]; links: LinkDraft[] }
  ) {
    event.preventDefault()
    if (!canManage) {
      return
    }
    setErrors([])
    setNotice('')
    const body = next
      ? {
          ...payload(),
          versions: next.versions.map((version) => ({
            name: version.name,
            key: version.key || null,
          })),
          links: next.links
            .filter((link) => link.url.trim())
            .map((link) => ({
              versionIndex: link.versionIndex,
              kind: link.kind,
              label: link.label,
              url: link.url,
            })),
        }
      : payload()

    try {
      if (songId) {
        await api(`/api/ministerios/${ministry.id}/musicas/${songId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        })
        setNotice('Música salva.')
        setOpenCard(null)
        if (!stay) {
          setEditing(false)
        }
        return
      }

      const created = await api<SongDetail>(`/api/ministerios/${ministry.id}/musicas`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      navigate(`/m/${ministry.id}/repertorio/${created.id}`, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function remove() {
    if (!songId) {
      return
    }
    await api(`/api/ministerios/${ministry.id}/musicas/${songId}`, { method: 'DELETE' })
    navigate(`/m/${ministry.id}/repertorio`, { replace: true })
  }

  function updateVersion(index: number, patch: Partial<VersionDraft>) {
    setVersions((current) =>
      current.map((version, itemIndex) =>
        itemIndex === index ? { ...version, ...patch } : version
      )
    )
  }

  function removeVersion(index: number) {
    setVersions((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setLinks((current) =>
      current.map((link) => {
        if (link.versionIndex === null) {
          return link
        }
        if (link.versionIndex === index) {
          return { ...link, versionIndex: null }
        }
        if (link.versionIndex > index) {
          return { ...link, versionIndex: link.versionIndex - 1 }
        }
        return link
      })
    )
  }

  function updateLink(index: number, patch: Partial<LinkDraft>) {
    setLinks((current) =>
      current.map((link, itemIndex) => (itemIndex === index ? { ...link, ...patch } : link))
    )
  }

  if (!ready) {
    return <p className="page-loading">Carregando…</p>
  }

  if (missing) {
    return (
      <section className="page">
        <h1>Música não encontrada</h1>
        <p className="row">
          <Link to={`/m/${ministry.id}/repertorio`}>Voltar</Link>
        </p>
      </section>
    )
  }

  if (!canManage && !songId) {
    return (
      <section className="page">
        <h1>Repertório</h1>
        <p className="empty-state-card">Você não pode fazer isso.</p>
        <p className="row">
          <Link to={`/m/${ministry.id}/repertorio`}>Voltar</Link>
        </p>
      </section>
    )
  }

  const classificationOptions = classifications.filter(
    (item) => !item.archived || item.id === classificationId
  )
  const folderName = folders.find((folder) => folder.id === folderId)?.name ?? ''
  const classificationName =
    classifications.find((item) => item.id === classificationId)?.name ?? ''

  function fillReferences(target: number | null) {
    const query = encodeURIComponent(`${title} ${artist}`.trim())
    const presets: Array<{ kind: LinkKind; label: string; url: string }> = [
      { kind: 'letra', label: 'Letra', url: `https://www.letras.mus.br/?q=${query}` },
      { kind: 'cifra', label: 'Cifra', url: `https://www.cifraclub.com.br/?q=${query}` },
      { kind: 'audio', label: 'Áudio', url: `https://open.spotify.com/search/${query}` },
      { kind: 'video', label: 'Vídeo', url: `https://www.youtube.com/results?search_query=${query}` },
    ]
    setLinks((current) => {
      const next = [...current]
      for (const preset of presets) {
        const exists = next.some(
          (link) => link.versionIndex === target && referenceGroup(link.kind, link.url) === preset.kind
        )
        if (!exists) {
          next.push({ versionIndex: target, ...preset })
        }
      }
      return next
    })
  }

  function addReference(target: number | null) {
    const order: LinkKind[] = ['letra', 'cifra', 'audio', 'video']
    setLinks((current) => {
      const used = new Set(
        current
          .filter((link) => link.versionIndex === target)
          .map((link) => referenceGroup(link.kind, link.url))
      )
      const kind = order.find((item) => !used.has(item)) ?? 'cifra'
      const label = LINK_KINDS.find((item) => item.value === kind)?.label ?? 'Cifra'
      return [...current, { versionIndex: target, kind, label, url: '' }]
    })
  }

  function markTempo() {
    const now = performance.now()
    const last = taps.at(-1)
    const next = last !== undefined && now - last > 2000 ? [now] : [...taps, now]
    setTaps(next)
    setTempo(bpmFromIntervals(intervalsFromTaps(next)))
  }

  if (songId && !editing) {
    return (
      <SongOverview
        ministryId={ministry.id}
        title={title}
        artist={artist}
        folderName={folderName}
        classificationName={classificationName}
        defaultKey={defaultKey}
        bpm={bpm}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
        versions={versions}
        links={links}
        canManage={canManage}
        notice={notice}
        onEdit={() => setEditing(true)}
        onDelete={() => void remove()}
      />
    )
  }

  function commitDraft(event: React.FormEvent) {
    event.preventDefault()
    if (!draft) {
      return
    }
    if (!draft.name.trim()) {
      setErrors([{ field: 'name', message: 'Informe o nome da versão.' }])
      return
    }
    const index = versions.length
    const nextVersions = [...versions, { name: draft.name.trim(), key: draft.key }]
    const nextLinks = [
      ...links,
      ...draft.links
        .filter((link) => link.url.trim())
        .map((link) => ({ ...link, versionIndex: index })),
    ]
    setVersions(nextVersions)
    setLinks(nextLinks)
    setDraft(null)
    setErrors([])
    if (!songId) {
      return
    }
    void save(event, true, { versions: nextVersions, links: nextLinks })
  }

  if (draft) {
    return (
      <VersionScreen
        heading="Nova versão"
        title={title}
        artist={artist}
        name={draft.name}
        onNameChange={(value) => setDraft((current) => (current ? { ...current, name: value } : current))}
        classificationId={draft.classificationId}
        classifications={classificationOptions}
        onClassification={(value) =>
          setDraft((current) => (current ? { ...current, classificationId: value } : current))
        }
        folderId=""
        folders={[]}
        onFolder={() => undefined}
        showFolder={false}
        notes={draft.notes}
        onNotes={(value) => setDraft((current) => (current ? { ...current, notes: value } : current))}
        songKey={draft.key}
        onKey={(value) => setDraft((current) => (current ? { ...current, key: value } : current))}
        bpm={draft.bpm}
        onBpm={(value) => setDraft((current) => (current ? { ...current, bpm: value } : current))}
        tempo={null}
        onTap={() => undefined}
        onApplyTempo={() => undefined}
        hours={draft.hours}
        minutes={draft.minutes}
        seconds={draft.seconds}
        onHours={(value) => setDraft((current) => (current ? { ...current, hours: value } : current))}
        onMinutes={(value) => setDraft((current) => (current ? { ...current, minutes: value } : current))}
        onSeconds={(value) => setDraft((current) => (current ? { ...current, seconds: value } : current))}
        links={draft.links}
        versionIndex={null}
        useAllLinks
        error={fieldMessage(errors, 'name')}
        errors={errors}
        onLinkChange={(index, patch) =>
          setDraft((current) =>
            current
              ? {
                  ...current,
                  links: current.links.map((link, item) => (item === index ? { ...link, ...patch } : link)),
                }
              : current
          )
        }
        onLinkRemove={(index) =>
          setDraft((current) =>
            current ? { ...current, links: current.links.filter((_, item) => item !== index) } : current
          )
        }
        onAddLink={() =>
          setDraft((current) =>
            current ? { ...current, links: [...current.links, { ...emptyLink(), label: 'Outro' }] } : current
          )
        }
        onFill={() => {
          const query = encodeURIComponent(`${title} ${artist}`.trim())
          const presets: Record<string, string> = {
            letra: `https://www.letras.mus.br/?q=${query}`,
            cifra: `https://www.cifraclub.com.br/?q=${query}`,
            audio: `https://open.spotify.com/search/${query}`,
            video: `https://www.youtube.com/results?search_query=${query}`,
          }
          setDraft((current) =>
            current
              ? {
                  ...current,
                  links: current.links.map((link) =>
                    link.url.trim() ? link : { ...link, url: presets[referenceGroup(link.kind, link.url)] ?? link.url }
                  ),
                }
              : current
          )
        }}
        onRemoveVersion={null}
        onClose={() => {
          setDraft(null)
          setErrors([])
        }}
        onSave={commitDraft}
      />
    )
  }

  if (openCard !== null) {
    const versionIndex = openCard === 'original' ? null : openCard
    const version = versionIndex === null ? null : versions[versionIndex]
    if (versionIndex === null || version) {
      return (
        <VersionScreen
          title={title}
          artist={artist}
          name={version ? version.name : originalName}
          onNameChange={(value) =>
            versionIndex === null
              ? setOriginalName(value)
              : updateVersion(versionIndex, { name: value })
          }
          classificationId={classificationId}
          classifications={classificationOptions}
          onClassification={setClassificationId}
          folderId={folderId}
          folders={folders}
          onFolder={setFolderId}
          notes={notes}
          onNotes={setNotes}
          songKey={version ? version.key : defaultKey}
          onKey={(value) =>
            versionIndex === null
              ? setDefaultKey(value)
              : updateVersion(versionIndex, { key: value })
          }
          bpm={bpm}
          onBpm={setBpm}
          tempo={tempo}
          onTap={markTempo}
          onApplyTempo={() => {
            if (tempo) {
              setBpm(String(tempo))
            }
          }}
          hours={hours}
          minutes={minutes}
          seconds={seconds}
          onHours={setHours}
          onMinutes={setMinutes}
          onSeconds={setSeconds}
          links={links}
          versionIndex={versionIndex}
          error={fieldMessage(errors, 'url') || fieldMessage(errors, 'bpm') || fieldMessage(errors, 'durationSeconds')}
          errors={errors}
          onLinkChange={updateLink}
          onLinkRemove={(index) => setLinks((current) => current.filter((_, item) => item !== index))}
          onAddLink={() => addReference(versionIndex)}
          onFill={() => fillReferences(versionIndex)}
          onRemoveVersion={
            versionIndex === null
              ? null
              : () => {
                  removeVersion(versionIndex)
                  setOpenCard(null)
                }
          }
          onClose={() => setOpenCard(null)}
          onSave={(event) => {
            if (!songId) {
              event.preventDefault()
              setOpenCard(null)
              return
            }
            void save(event, true)
          }}
        />
      )
    }
  }

  return (
    <section className="page song-screen">
      <header className="song-top">
        <button
          type="button"
          className="notice-icon-button"
          aria-label={songId ? 'Voltar à música' : 'Voltar ao repertório'}
          onClick={() =>
            songId ? setEditing(false) : navigate(`/m/${ministry.id}/repertorio`)
          }
        >
          <Icon name="x" size={18} />
        </button>
        <h1>{songId ? 'Editar música' : 'Cadastrar música'}</h1>
        <span />
      </header>
      <form id="song-form" onSubmit={(event) => void save(event)} className="song-column song-edit">
        <FieldErrors errors={errors} />
        {notice ? <p className="notice">{notice}</p> : null}
        <label className="song-input">
          <Icon name="pencil" size={16} />
          <span>
            {title ? <small>Título *</small> : null}
            <input
              name="title"
              value={title}
              placeholder="Título *"
              readOnly={!canManage}
              onChange={(event) => setTitle(event.target.value)}
            />
          </span>
        </label>
        {fieldMessage(errors, 'title') ? <small className="song-error">{fieldMessage(errors, 'title')}</small> : null}
        <label className="song-input">
          <Icon name="user" size={16} />
          <span>
            {artist ? <small>Artista *</small> : null}
            <input
              name="artist"
              value={artist}
              placeholder="Artista *"
              readOnly={!canManage}
              onChange={(event) => setArtist(event.target.value)}
            />
          </span>
        </label>
        <label className="song-notes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <textarea
            name="notes"
            value={notes}
            maxLength={150}
            placeholder="Observações gerais"
            readOnly={!canManage}
            onChange={(event) => setNotes(event.target.value)}
          />
          <span>{notes.length}/150</span>
        </label>

        <div className="song-versions-head">
          <span>
            Versões <em>{1 + versions.length}</em>
          </span>
          {canManage ? (
            <button type="button" onClick={() => setDraft(blankVersionForm())}>
              <Icon name="plus" size={14} /> Adicionar
            </button>
          ) : null}
        </div>

        <article className="song-version-card">
          <header>
            <strong>{originalName || 'Original'}</strong>
            <span className="repertoire-marks" aria-hidden="true">
              <Icon name="alert" size={14} color={bpm ? '#e0a23a' : 'var(--muted)'} />
              <Icon name="music" size={14} color="var(--brand)" />
              <span className="repertoire-flag" style={{ background: defaultKey ? '#e85d4c' : 'var(--muted)' }} />
            </span>
          </header>
          <ul className="song-version-facts">
            <li>
              <span>Classificações:</span> {classificationName || '—'}
            </li>
            <li>
              <span>Tom:</span> {defaultKey || '—'}
            </li>
            <li>
              <span>BPM:</span> {bpm || '—'}
            </li>
            <li>
              <span>Duração:</span> {clockLabel(hours, minutes, seconds)}
            </li>
          </ul>
          {canManage ? (
            <footer className="song-version-actions">
              <button type="button" onClick={() => setVersions((current) => [...current, { name: 'Original', key: defaultKey }])}>
                Clonar
              </button>
              <button type="button" onClick={() => setOpenCard('original')}>
                <Icon name="pencil" size={14} /> Editar
              </button>
            </footer>
          ) : null}
        </article>

        {versions.map((version, index) => (
          <article key={index} className="song-version-card">
            <header>
              <strong>{version.name || 'Nova versão'}</strong>
            </header>
            <ul className="song-version-facts">
              <li>
                <span>Tom:</span> {version.key || '—'}
              </li>
            </ul>
            {canManage ? (
              <footer className="song-version-actions">
                <button type="button" onClick={() => setVersions((current) => [...current, { ...version }])}>
                  Clonar
                </button>
                <button type="button" onClick={() => setOpenCard(index)}>
                  <Icon name="pencil" size={14} /> Editar
                </button>
              </footer>
            ) : null}
          </article>
        ))}

        {canManage && songId ? (
          <button type="button" className="song-delete" onClick={() => void remove()}>
            Excluir música
          </button>
        ) : null}
      </form>
      {canManage ? (
        <button type="submit" form="song-form" className="notice-add">
          <Icon name="check" size={16} color="#ffffff" /> Salvar
        </button>
      ) : null}
    </section>
  )
}

function VersionScreen({
  heading = 'Editar versão',
  title,
  artist,
  name,
  onNameChange,
  classificationId,
  classifications,
  onClassification,
  folderId,
  folders,
  onFolder,
  showFolder = true,
  notes,
  onNotes,
  songKey,
  onKey,
  bpm,
  onBpm,
  tempo,
  onTap,
  onApplyTempo,
  hours,
  minutes,
  seconds,
  onHours,
  onMinutes,
  onSeconds,
  links,
  versionIndex,
  useAllLinks = false,
  error,
  errors,
  onLinkChange,
  onLinkRemove,
  onAddLink,
  onFill,
  onRemoveVersion,
  onClose,
  onSave,
}: {
  heading?: string
  title: string
  artist: string
  name: string
  onNameChange: (value: string) => void
  classificationId: string
  classifications: ClassificationItem[]
  onClassification: (value: string) => void
  folderId: string
  folders: FolderItem[]
  onFolder: (value: string) => void
  showFolder?: boolean
  notes: string
  onNotes: (value: string) => void
  songKey: string
  onKey: (value: string) => void
  bpm: string
  onBpm: (value: string) => void
  tempo: number | null
  onTap: () => void
  onApplyTempo: () => void
  hours: string
  minutes: string
  seconds: string
  onHours: (value: string) => void
  onMinutes: (value: string) => void
  onSeconds: (value: string) => void
  links: LinkDraft[]
  versionIndex: number | null
  useAllLinks?: boolean
  error: string | undefined
  errors: FieldError[]
  onLinkChange: (index: number, patch: Partial<LinkDraft>) => void
  onLinkRemove: (index: number) => void
  onAddLink: () => void
  onFill: () => void
  onRemoveVersion: (() => void) | null
  onClose: () => void
  onSave: (event: React.FormEvent) => void
}) {
  const visible = (useAllLinks ? links.map((link, index) => ({ link, index })) : links
    .map((link, index) => ({ link, index }))
    .filter((item) => item.link.versionIndex === versionIndex))
  const duration = clockLabel(hours, minutes, seconds)
  const blank = heading === 'Nova versão'

  return (
    <section className="page song-screen">
      <header className="song-top">
        <button type="button" className="notice-icon-button" aria-label="Fechar versão" onClick={onClose}>
          <Icon name="x" size={18} />
        </button>
        <h1>{heading}</h1>
        <span />
      </header>
      <form id="version-form" className="song-column song-edit" onSubmit={onSave}>
        <FieldErrors errors={errors} />
        <div className="version-song">
          <Icon name="music" size={18} />
          <div>
            <strong>{title || 'Música'}</strong>
            {artist ? <span>{artist}</span> : null}
          </div>
        </div>
        <label className="song-input">
          <Icon name="pencil" size={16} />
          <span>
            {name ? <small>Nome da versão *</small> : null}
            <input
              name="versionName"
              value={name}
              maxLength={80}
              placeholder={blank ? 'Nome da versão' : 'Nome da versão *'}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </span>
          <em>{name.length}/30</em>
        </label>
        <label className="song-input">
          <Icon name="archive" size={16} />
          <span>
            {classificationId ? <small>Classificações *</small> : null}
            <select value={classificationId} onChange={(event) => onClassification(event.target.value)}>
              <option value="">{blank ? 'Classificações *' : 'Sem classificação'}</option>
              {classifications.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.archived ? ' (arquivada)' : ''}
                </option>
              ))}
            </select>
          </span>
        </label>
        {showFolder ? (
        <label className="song-input">
          <Icon name="archive" size={16} />
          <span>
            <small>Pasta</small>
            <select value={folderId} onChange={(event) => onFolder(event.target.value)}>
              <option value="">Sem pasta</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </span>
        </label>
        ) : null}
        <label className="song-notes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <textarea
            name="notes"
            value={notes}
            maxLength={150}
            placeholder="Observações"
            onChange={(event) => onNotes(event.target.value)}
          />
          <span>{notes.length}/150</span>
        </label>
        <div className="version-pair">
          <label className="song-input">
            <Icon name="music" size={16} />
            <span>
              {songKey ? <small>Tom</small> : null}
              <select value={songKey} onChange={(event) => onKey(event.target.value)}>
                <option value="">Tom</option>
                {SONG_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label className="song-input">
            <button type="button" className="version-tap" aria-label="Marcar ritmo" onClick={onTap}>
              <Icon name="clock" size={16} />
            </button>
            <span>
              {bpm ? <small>BPM</small> : null}
              <input
                name="bpm"
                value={bpm}
                inputMode="numeric"
                placeholder="BPM"
                onChange={(event) => onBpm(event.target.value)}
              />
            </span>
          </label>
        </div>
        {tempo ? (
          <button type="button" className="version-apply" onClick={onApplyTempo}>
            Gravar {tempo} BPM
          </button>
        ) : null}
        {error ? <small className="song-error">{error}</small> : null}
        <div className="version-duration">
          <p>
            Duração
            {duration !== '—' ? <strong>{duration}</strong> : <Icon name="info" size={14} />}
          </p>
          <div>
            <label>
              <input
                value={hours}
                inputMode="numeric"
                placeholder="Horas"
                onChange={(event) => onHours(event.target.value)}
              />
              {hours ? <small>Horas</small> : null}
            </label>
            <span>:</span>
            <label>
              <input
                value={minutes}
                inputMode="numeric"
                placeholder="Minutos"
                onChange={(event) => onMinutes(event.target.value)}
              />
              {minutes ? <small>Minutos</small> : null}
            </label>
            <span>:</span>
            <label>
              <input
                value={seconds}
                inputMode="numeric"
                placeholder="Segundos"
                onChange={(event) => onSeconds(event.target.value)}
              />
              {seconds ? <small>Segundos</small> : null}
            </label>
          </div>
        </div>
        <div className="version-references-head">
          <span>Referências</span>
          <button type="button" onClick={onFill}>
            <Icon name="sliders" size={14} /> Autopreenchimento
          </button>
        </div>
        <ul className="version-links">
          {visible.map(({ link, index }) => {
            const group = referenceGroup(link.kind, link.url)
            const kindLabel = LINK_KINDS.find((item) => item.value === group)?.label ?? 'Outro'
            const href = /^https?:\/\//i.test(link.url) ? link.url : undefined
            return (
              <li key={index}>
                <span className={`song-reference-mark is-${group}`} aria-hidden="true">
                  {kindLabel.slice(0, 1)}
                </span>
                <label>
                  <small>Link {kindLabel.toLocaleLowerCase('pt')}</small>
                  <input
                    value={link.url}
                    placeholder="https://"
                    onChange={(event) => onLinkChange(index, { url: event.target.value })}
                  />
                </label>
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" aria-label="Abrir referência">
                    <Icon name="external" size={16} />
                  </a>
                ) : (
                  <span className="version-link-idle" aria-hidden="true">
                    <Icon name="external" size={16} />
                  </span>
                )}
                {blank ? null : (
                  <button type="button" aria-label="Remover referência" onClick={() => onLinkRemove(index)}>
                    <Icon name="x" size={14} />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
        <button type="button" className="version-add" onClick={onAddLink}>
          <Icon name="plus" size={14} /> Adicionar referência
        </button>
        {onRemoveVersion ? (
          <button type="button" className="song-delete" onClick={onRemoveVersion}>
            Remover versão
          </button>
        ) : null}
      </form>
      <button type="submit" form="version-form" className="notice-add">
        <Icon name="check" size={16} color="#ffffff" /> Salvar
      </button>
    </section>
  )
}

function SongOverview({
  ministryId,
  title,
  artist,
  folderName,
  classificationName,
  defaultKey,
  bpm,
  hours,
  minutes,
  seconds,
  versions,
  links,
  canManage,
  notice,
  onEdit,
  onDelete,
}: {
  ministryId: string
  title: string
  artist: string
  folderName: string
  classificationName: string
  defaultKey: string
  bpm: string
  hours: string
  minutes: string
  seconds: string
  versions: VersionDraft[]
  links: LinkDraft[]
  canManage: boolean
  notice: string
  onEdit: () => void
  onDelete: () => void
}) {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [versionIndex, setVersionIndex] = useState<number | null>(null)
  const selected = versionIndex === null ? null : versions[versionIndex]
  const tone = selected?.key || defaultKey || '—'
  const query = encodeURIComponent(`${title} ${artist}`.trim())
  const scoped =
    versionIndex === null
      ? links.filter((link) => link.versionIndex === null)
      : links.filter((link) => link.versionIndex === versionIndex)
  const visibleLinks = (scoped.length > 0 ? scoped : links)
    .slice()
    .sort(
      (left, right) =>
        REFERENCE_ORDER.indexOf(referenceGroup(left.kind, left.url)) -
        REFERENCE_ORDER.indexOf(referenceGroup(right.kind, right.url))
    )

  return (
    <section className="page song-screen">
      <header className="song-top">
        <button
          type="button"
          className="notice-icon-button"
          aria-label="Fechar"
          onClick={() => navigate(`/m/${ministryId}/repertorio`)}
        >
          <Icon name="x" size={18} />
        </button>
        <h1>Música</h1>
        {canManage ? (
          <button
            type="button"
            className="notice-icon-button"
            aria-label="Mais opções"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name="more" size={18} />
          </button>
        ) : (
          <span />
        )}
      </header>

      <div className="song-column">
        {notice ? <p className="notice">{notice}</p> : null}
        {menuOpen && canManage ? (
          <div className="song-menu">
            <button type="button" onClick={onEdit}>
              Editar
            </button>
            <button type="button" className="button-danger-outline" onClick={onDelete}>
              Excluir música
            </button>
          </div>
        ) : null}

        <div className="song-hero">
          <span
            className="song-cover"
            style={{ background: `hsl(${coverHue(title || 'M')} 32% 32%)` }}
            aria-hidden="true"
          >
            {(title || 'M').slice(0, 1).toLocaleUpperCase('pt')}
          </span>
          <div>
            <h2>{title}</h2>
            {folderName ? <p>Álbum: {folderName}</p> : null}
            {artist ? (
              <p className="song-artist">
                <span aria-hidden="true">{artist.slice(0, 1).toLocaleUpperCase('pt')}</span>
                {artist}
              </p>
            ) : null}
          </div>
        </div>

        <div className="song-platforms">
          {PLATFORMS.map((platform) => {
            const saved = links.find((link) => link.url.toLowerCase().includes(platform.host))
            return (
              <a
                key={platform.name}
                href={saved?.url ?? platform.search(query)}
                target="_blank"
                rel="noreferrer"
              >
                {platform.name}
                <Icon name="external" size={12} />
              </a>
            )
          })}
        </div>

        <div className="song-versions">
          <span>Versão</span>
          <button
            type="button"
            aria-pressed={versionIndex === null}
            onClick={() => setVersionIndex(null)}
          >
            Original
          </button>
          {versions.map((version, index) => (
            <button
              key={`${version.name}-${index}`}
              type="button"
              aria-pressed={versionIndex === index}
              onClick={() => setVersionIndex(index)}
            >
              {version.name || `Versão ${index + 1}`}
            </button>
          ))}
        </div>

        <div className="song-card">
          <div className="song-metrics">
            <div>
              <span>Tom</span>
              <strong>{tone}</strong>
            </div>
            <div>
              <span>BPM</span>
              <strong>{bpm || '—'}</strong>
            </div>
            <div>
              <span>Duração</span>
              <strong>{clockLabel(hours, minutes, seconds)}</strong>
            </div>
          </div>

          <p className="song-label">Classificações</p>
          <p className="song-classification">{classificationName || '—'}</p>

          <p className="song-label">
            <Icon name="music" size={14} /> Referências
          </p>
          {visibleLinks.length === 0 ? <p className="song-empty">Nenhuma referência.</p> : null}
          <ul className="song-references">
            {visibleLinks.map((link, index) => {
              const group = referenceGroup(link.kind, link.url)
              const kindLabel = LINK_KINDS.find((item) => item.value === group)?.label ?? 'Outro'
              return (
                <li key={`${link.url}-${index}`}>
                  <a href={link.url} target="_blank" rel="noreferrer">
                    <span className={`song-reference-mark is-${group}`} aria-hidden="true">
                      {kindLabel.slice(0, 1)}
                    </span>
                    <span>
                      <strong>{kindLabel}</strong>
                      <em>{link.url}</em>
                    </span>
                    <Icon name="chevron-right" size={16} />
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

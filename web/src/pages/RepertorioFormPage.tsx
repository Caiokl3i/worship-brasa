import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
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

type VersionDraft = { name: string; key: string }
type LinkDraft = { versionIndex: number | null; kind: LinkKind; label: string; url: string }

const emptyVersion = (): VersionDraft => ({ name: '', key: '' })
const emptyLink = (): LinkDraft => ({ versionIndex: null, kind: 'cifra', label: '', url: '' })

export function RepertorioFormPage() {
  const navigate = useNavigate()
  const params = useParams()
  const songId = params.songId
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageRepertoire
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [defaultKey, setDefaultKey] = useState('')
  const [bpm, setBpm] = useState('')
  const [minutes, setMinutes] = useState('')
  const [seconds, setSeconds] = useState('')
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
        setDefaultKey(song.defaultKey ?? '')
        setBpm(song.bpm === null ? '' : String(song.bpm))
        setMinutes(
          song.durationSeconds === null ? '' : String(Math.floor(song.durationSeconds / 60))
        )
        setSeconds(song.durationSeconds === null ? '' : String(song.durationSeconds % 60))
        setClassificationId(song.classification?.id ?? '')
        setFolderId(song.folder?.id ?? '')
        setVersions(song.versions.map((version) => ({ name: version.name, key: version.key ?? '' })))
        setLinks(
          song.links.map((link) => {
            const versionIndex = link.versionId
              ? song.versions.findIndex((version) => version.id === link.versionId)
              : -1
            return {
              versionIndex: versionIndex >= 0 ? versionIndex : null,
              kind: link.kind,
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
    if (minutes.trim() === '' && seconds.trim() === '') {
      return null
    }
    const total = Number(minutes || 0) * 60 + Number(seconds || 0)
    return total > 0 ? total : null
  }

  function payload() {
    return {
      title,
      artist: artist.trim() || null,
      bpm: bpm.trim() === '' ? null : Number(bpm),
      durationSeconds: durationSeconds(),
      defaultKey: defaultKey || null,
      classificationId: classificationId || null,
      folderId: folderId || null,
      versions: versions.map((version) => ({
        name: version.name,
        key: version.key || null,
      })),
      links: links.map((link) => ({
        versionIndex: link.versionIndex,
        kind: link.kind,
        label: link.label,
        url: link.url,
      })),
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!canManage) {
      return
    }
    setErrors([])
    setNotice('')

    try {
      if (songId) {
        await api(`/api/ministerios/${ministry.id}/musicas/${songId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload()),
        })
        setNotice('Música salva.')
        return
      }

      const created = await api<SongDetail>(`/api/ministerios/${ministry.id}/musicas`, {
        method: 'POST',
        body: JSON.stringify(payload()),
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
      current.map((version, itemIndex) => (itemIndex === index ? { ...version, ...patch } : version))
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
    return <p>Carregando…</p>
  }

  if (missing) {
    return (
      <section>
        <h1>Música não encontrada.</h1>
        <p>
          <Link to={`/m/${ministry.id}/repertorio`}>Voltar</Link>
        </p>
      </section>
    )
  }

  if (!canManage && !songId) {
    return (
      <section>
        <h1>Repertório</h1>
        <p>Você não pode fazer isso.</p>
        <p>
          <Link to={`/m/${ministry.id}/repertorio`}>Voltar</Link>
        </p>
      </section>
    )
  }

  const classificationOptions = classifications.filter(
    (item) => !item.archived || item.id === classificationId
  )

  return (
    <section>
      <p className="eyebrow">Repertório</p>
      <h1>{songId ? title || 'Música' : 'Cadastrar música'}</h1>
      <form onSubmit={(event) => void save(event)} className="form">
        <FieldErrors errors={errors} />
        {notice ? <p className="notice">{notice}</p> : null}
        <TextField
          label="Título"
          name="title"
          value={title}
          onChange={setTitle}
          readOnly={!canManage}
          message={fieldMessage(errors, 'title')}
        />
        <TextField
          label="Artista"
          name="artist"
          value={artist}
          onChange={setArtist}
          readOnly={!canManage}
          message={fieldMessage(errors, 'artist')}
        />
        <label className="field">
          <span>Tom</span>
          <select
            name="defaultKey"
            value={defaultKey}
            disabled={!canManage}
            onChange={(event) => setDefaultKey(event.target.value)}
          >
            <option value="">Sem tom</option>
            {SONG_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          {fieldMessage(errors, 'defaultKey') ? <small>{fieldMessage(errors, 'defaultKey')}</small> : null}
        </label>
        <TextField
          label="BPM"
          name="bpm"
          value={bpm}
          onChange={setBpm}
          readOnly={!canManage}
          message={fieldMessage(errors, 'bpm')}
        />
        <div className="row">
          <TextField
            label="Minutos"
            name="minutes"
            value={minutes}
            onChange={setMinutes}
            readOnly={!canManage}
          />
          <TextField
            label="Segundos"
            name="seconds"
            value={seconds}
            onChange={setSeconds}
            readOnly={!canManage}
            message={fieldMessage(errors, 'durationSeconds')}
          />
        </div>
        <label className="field">
          <span>Classificação</span>
          <select
            name="classificationId"
            value={classificationId}
            disabled={!canManage}
            onChange={(event) => setClassificationId(event.target.value)}
          >
            <option value="">Sem classificação</option>
            {classificationOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.archived ? ' (arquivada)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Pasta</span>
          <select
            name="folderId"
            value={folderId}
            disabled={!canManage}
            onChange={(event) => setFolderId(event.target.value)}
          >
            <option value="">Sem pasta</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>

        <h2>Versões</h2>
        {versions.length === 0 ? <p>Nenhuma versão.</p> : null}
        {versions.map((version, index) => (
          <div key={index} className="card">
            <TextField
              label="Nome"
              name={`version-name-${index}`}
              value={version.name}
              onChange={(value) => updateVersion(index, { name: value })}
              readOnly={!canManage}
            />
            <label className="field">
              <span>Tom da versão</span>
              <select
                name={`version-key-${index}`}
                value={version.key}
                disabled={!canManage}
                onChange={(event) => updateVersion(index, { key: event.target.value })}
              >
                <option value="">Sem tom</option>
                {SONG_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
            {canManage ? (
              <button type="button" onClick={() => removeVersion(index)}>
                Remover versão
              </button>
            ) : null}
          </div>
        ))}
        {canManage ? (
          <button type="button" onClick={() => setVersions((current) => [...current, emptyVersion()])}>
            Acrescentar versão
          </button>
        ) : null}

        <h2>Links</h2>
        {links.length === 0 ? <p>Nenhum link.</p> : null}
        {links.map((link, index) => (
          <div key={index} className="card">
            <label className="field">
              <span>Tipo</span>
              <select
                name={`link-kind-${index}`}
                value={link.kind}
                disabled={!canManage}
                onChange={(event) => updateLink(index, { kind: event.target.value as LinkKind })}
              >
                {LINK_KINDS.map((kind) => (
                  <option key={kind.value} value={kind.value}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </label>
            <TextField
              label="Rótulo"
              name={`link-label-${index}`}
              value={link.label}
              onChange={(value) => updateLink(index, { label: value })}
              readOnly={!canManage}
            />
            {canManage ? (
              <TextField
                label="URL"
                name={`link-url-${index}`}
                value={link.url}
                onChange={(value) => updateLink(index, { url: value })}
                message={fieldMessage(errors, 'url')}
              />
            ) : (
              <p>
                <a href={link.url}>{link.url}</a>
              </p>
            )}
            <label className="field">
              <span>Versão</span>
              <select
                name={`link-version-${index}`}
                value={link.versionIndex === null ? '' : String(link.versionIndex)}
                disabled={!canManage}
                onChange={(event) =>
                  updateLink(index, {
                    versionIndex: event.target.value === '' ? null : Number(event.target.value),
                  })
                }
              >
                <option value="">Música</option>
                {versions.map((version, versionIndex) => (
                  <option key={versionIndex} value={versionIndex}>
                    {version.name || `Versão ${versionIndex + 1}`}
                  </option>
                ))}
              </select>
            </label>
            {canManage ? (
              <button
                type="button"
                onClick={() => setLinks((current) => current.filter((_, item) => item !== index))}
              >
                Remover link
              </button>
            ) : null}
          </div>
        ))}
        {canManage ? (
          <button type="button" onClick={() => setLinks((current) => [...current, emptyLink()])}>
            Acrescentar link
          </button>
        ) : null}

        {canManage ? <button type="submit">Salvar</button> : null}
      </form>
      {canManage && songId ? (
        <button type="button" onClick={() => void remove()}>
          Excluir música
        </button>
      ) : null}
      <p>
        <Link to={`/m/${ministry.id}/repertorio`}>Voltar</Link>
      </p>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldErrors } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import {
  formatDuration,
  type ClassificationItem,
  type FolderItem,
  type SongSummary,
} from '../lib/repertoire.ts'

export function RepertorioPage() {
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageRepertoire
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [folderId, setFolderId] = useState('')
  const [classificationId, setClassificationId] = useState('')
  const [songs, setSongs] = useState<SongSummary[] | null>(null)
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [classifications, setClassifications] = useState<ClassificationItem[]>([])

  async function loadCatalog(term = query, folder = folderId, classification = classificationId) {
    const params = new URLSearchParams()
    if (term) {
      params.set('q', term)
    }
    if (folder) {
      params.set('folderId', folder)
    }
    if (classification) {
      params.set('classificationId', classification)
    }
    const suffix = params.toString() ? `?${params.toString()}` : ''
    const [songBody, folderBody, classificationBody] = await Promise.all([
      api<{ songs: SongSummary[] }>(`/api/ministerios/${ministry.id}/musicas${suffix}`),
      api<{ folders: FolderItem[] }>(`/api/ministerios/${ministry.id}/pastas`),
      api<{ classifications: ClassificationItem[] }>(
        `/api/ministerios/${ministry.id}/classificacoes`
      ),
    ])
    setSongs(songBody.songs)
    setFolders(folderBody.folders)
    setClassifications(classificationBody.classifications)
  }

  useEffect(() => {
    void loadCatalog('', '', '')
  }, [ministry.id])

  const emptyCatalog = songs?.length === 0 && !query && !folderId && !classificationId

  return (
    <section>
      <p className="eyebrow">Repertório</p>
      <h1>{ministry.name}</h1>

      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault()
          setQuery(draft)
          void loadCatalog(draft, folderId, classificationId)
        }}
      >
        <TextField label="Buscar por título ou artista" name="q" value={draft} onChange={setDraft} />
        <label className="field">
          <span>Pasta</span>
          <select
            name="folderId"
            value={folderId}
            onChange={(event) => {
              setFolderId(event.target.value)
              void loadCatalog(query, event.target.value, classificationId)
            }}
          >
            <option value="">Todas</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Classificação</span>
          <select
            name="classificationId"
            value={classificationId}
            onChange={(event) => {
              setClassificationId(event.target.value)
              void loadCatalog(query, folderId, event.target.value)
            }}
          >
            <option value="">Todas</option>
            {classifications
              .filter((item) => !item.archived)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <button type="submit">Buscar</button>
      </form>

      {songs === null ? <p>Carregando…</p> : null}
      {emptyCatalog ? (
        <p>
          Ainda não há músicas neste repertório.
          {canManage ? (
            <>
              {' '}
              <Link to={`/m/${ministry.id}/repertorio/nova`}>Cadastrar música</Link>
            </>
          ) : null}
        </p>
      ) : null}
      {songs && songs.length === 0 && !emptyCatalog ? <p>Nenhuma música encontrada.</p> : null}

      {songs && songs.length > 0 ? (
        <ul className="list">
          {songs.map((song) => (
            <li key={song.id} className="card">
              <Link to={`/m/${ministry.id}/repertorio/${song.id}`}>
                <strong>{song.title}</strong>
              </Link>
              <span>
                {[song.artist, song.defaultKey, formatDuration(song.durationSeconds)]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
              <span>
                {[song.folder?.name, song.classification?.name].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {canManage && songs && songs.length > 0 ? (
        <p>
          <Link to={`/m/${ministry.id}/repertorio/nova`}>Cadastrar música</Link>
        </p>
      ) : null}

      {canManage ? (
        <CatalogSettings
          ministryId={ministry.id}
          folders={folders}
          classifications={classifications}
          onChanged={() => void loadCatalog()}
        />
      ) : null}

      <p>
        <Link to={`/m/${ministry.id}`}>Voltar</Link>
      </p>
    </section>
  )
}

function CatalogSettings({
  ministryId,
  folders,
  classifications,
  onChanged,
}: {
  ministryId: string
  folders: FolderItem[]
  classifications: ClassificationItem[]
  onChanged: () => void
}) {
  const [folderName, setFolderName] = useState('')
  const [classificationName, setClassificationName] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  async function createFolder(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    try {
      await api(`/api/ministerios/${ministryId}/pastas`, {
        method: 'POST',
        body: JSON.stringify({ name: folderName }),
      })
      setFolderName('')
      onChanged()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function renameFolder(folderId: string, name: string) {
    setErrors([])
    try {
      await api(`/api/ministerios/${ministryId}/pastas/${folderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      onChanged()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function deleteFolder(folderId: string) {
    await api(`/api/ministerios/${ministryId}/pastas/${folderId}`, { method: 'DELETE' })
    onChanged()
  }

  async function createClassification(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    try {
      await api(`/api/ministerios/${ministryId}/classificacoes`, {
        method: 'POST',
        body: JSON.stringify({ name: classificationName, description }),
      })
      setClassificationName('')
      setDescription('')
      onChanged()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function archive(classificationId: string) {
    await api(`/api/ministerios/${ministryId}/classificacoes/${classificationId}/arquivar`, {
      method: 'POST',
    })
    onChanged()
  }

  return (
    <>
      <h2>Pastas</h2>
      <FieldErrors errors={errors} />
      {folders.length === 0 ? <p>Nenhuma pasta.</p> : null}
      <ul className="list">
        {folders.map((folder) => (
          <FolderRow
            key={folder.id}
            folder={folder}
            onRename={(name) => void renameFolder(folder.id, name)}
            onDelete={() => void deleteFolder(folder.id)}
          />
        ))}
      </ul>
      <form onSubmit={(event) => void createFolder(event)} className="form">
        <TextField label="Nova pasta" name="folderName" value={folderName} onChange={setFolderName} />
        <button type="submit">Criar pasta</button>
      </form>

      <h2>Classificações</h2>
      <ul className="list">
        {classifications.map((item) => (
          <li key={item.id} className="card">
            <strong>
              {item.name}
              {item.archived ? ' · arquivada' : ''}
            </strong>
            {item.description ? <span>{item.description}</span> : null}
            {item.archived ? null : (
              <button type="button" onClick={() => void archive(item.id)}>
                Arquivar
              </button>
            )}
          </li>
        ))}
      </ul>
      <form onSubmit={(event) => void createClassification(event)} className="form">
        <TextField
          label="Nova classificação"
          name="classificationName"
          value={classificationName}
          onChange={setClassificationName}
        />
        <label className="field">
          <span>Descrição</span>
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <button type="submit">Criar classificação</button>
      </form>
    </>
  )
}

function FolderRow({
  folder,
  onRename,
  onDelete,
}: {
  folder: FolderItem
  onRename: (name: string) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(folder.name)

  return (
    <li className="card">
      <form
        className="row"
        onSubmit={(event) => {
          event.preventDefault()
          onRename(name)
        }}
      >
        <TextField label="Nome" name={`folder-${folder.id}`} value={name} onChange={setName} />
        <button type="submit">Renomear</button>
        <button type="button" onClick={onDelete}>
          Excluir
        </button>
      </form>
    </li>
  )
}

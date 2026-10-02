import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldErrors } from '../components/FieldErrors.tsx'
import { Icon } from '../components/Icon.tsx'
import { TextField } from '../components/TextField.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { type ClassificationItem, type FolderItem, type SongSummary } from '../lib/repertoire.ts'
import { downloadCsv } from '../lib/spreadsheet.ts'

type CatalogTab = 'musicas' | 'pastas' | 'artistas'

const KEY_COLORS: Record<string, string> = {
  C: '#e85d4c',
  'C#': '#e85d4c',
  D: '#3d9a6a',
  Eb: '#3d9a6a',
  E: '#e85d4c',
  F: '#3d9a6a',
  'F#': '#d4a017',
  G: '#e85d4c',
  Ab: '#3d9a6a',
  A: '#3d9a6a',
  Bb: '#e85d4c',
  B: '#3d9a6a',
}

function coverHue(title: string) {
  let hash = 0
  for (const char of title) {
    hash = (hash + char.charCodeAt(0) * 17) % 360
  }
  return hash
}

function songLine(song: SongSummary) {
  const label = song.classification?.name || song.folder?.name || ''
  const key = song.defaultKey ? `Tom: ${song.defaultKey}` : ''
  return [label, key].filter(Boolean).join(', ')
}

export function RepertorioPage() {
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageRepertoire
  const [tab, setTab] = useState<CatalogTab>('musicas')
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [folderId, setFolderId] = useState('')
  const [artistName, setArtistName] = useState('')
  const [songs, setSongs] = useState<SongSummary[] | null>(null)
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [classifications, setClassifications] = useState<ClassificationItem[]>([])
  const [csv, setCsv] = useState('')
  const [preview, setPreview] = useState<Array<{
    title: string
    artist: string
    action: 'criar' | 'ignorar'
    reason: string
  }> | null>(null)
  const [sheetError, setSheetError] = useState('')

  async function loadCatalog() {
    const [songBody, folderBody, classificationBody] = await Promise.all([
      api<{ songs: SongSummary[] }>(`/api/ministerios/${ministry.id}/musicas`),
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
    void loadCatalog()
  }, [ministry.id])

  const artists = useMemo(() => {
    const counts = new Map<string, number>()
    for (const song of songs ?? []) {
      const name = song.artist?.trim() || 'Sem artista'
      counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    return [...counts.entries()].sort((left, right) => left[0].localeCompare(right[0], 'pt'))
  }, [songs])

  const visibleSongs = (songs ?? []).filter((song) => {
    if (folderId && song.folder?.id !== folderId) {
      return false
    }
    if (artistName && (song.artist?.trim() || 'Sem artista') !== artistName) {
      return false
    }
    if (query) {
      const haystack = `${song.title} ${song.artist ?? ''}`.toLocaleLowerCase('pt')
      if (!haystack.includes(query.toLocaleLowerCase('pt'))) {
        return false
      }
    }
    return true
  })

  const activeFolder = folders.find((folder) => folder.id === folderId)
  const emptyCatalog = songs?.length === 0

  return (
    <section className="page repertoire-screen">
      <header className="repertoire-top">
        <span />
        <div className="repertoire-heading">
          <h1>Repertório</h1>
          <p>{ministry.name}</p>
        </div>
        <div className="repertoire-actions">
          <button
            type="button"
            className="notice-icon-button"
            aria-label={searchOpen ? 'Fechar busca' : 'Buscar'}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
          >
            <Icon name={searchOpen ? 'x' : 'search'} size={18} />
          </button>
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
          ) : null}
        </div>
      </header>

      <div className="repertoire-column">
      {searchOpen ? (
        <form
          className="repertoire-search"
          onSubmit={(event) => {
            event.preventDefault()
            setQuery(draft.trim())
            setTab('musicas')
          }}
        >
          <input
            name="q"
            value={draft}
            autoFocus
            placeholder="Buscar por título ou artista"
            onChange={(event) => setDraft(event.target.value)}
          />
        </form>
      ) : null}

      <div className="repertoire-segment" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'musicas'} onClick={() => setTab('musicas')}>
          Músicas ({songs?.length ?? 0})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'pastas'} onClick={() => setTab('pastas')}>
          Pastas ({folders.length})
        </button>
        <button type="button" role="tab" aria-selected={tab === 'artistas'} onClick={() => setTab('artistas')}>
          Artistas ({artists.length})
        </button>
      </div>

      {menuOpen && canManage ? (
        <form
          className="form repertoire-menu"
          onSubmit={(event) => {
            event.preventDefault()
            setSheetError('')
            void api<{
              rows: Array<{
                title: string
                artist: string
                action: 'criar' | 'ignorar'
                reason: string
              }>
            }>(`/api/ministerios/${ministry.id}/repertorio/previa`, {
              method: 'POST',
              body: JSON.stringify({ csv }),
            })
              .then((body) => setPreview(body.rows))
              .catch((error: unknown) => {
                if (error instanceof ApiError) {
                  setSheetError(error.message)
                }
              })
          }}
        >
          <h2>Planilha</h2>
          {sheetError ? <p className="errors">{sheetError}</p> : null}
          <div className="row">
            <button
              type="button"
              onClick={() =>
                void downloadCsv(`/api/ministerios/${ministry.id}/repertorio/modelo`, 'modelo.csv')
              }
            >
              Baixar modelo
            </button>
            <button
              type="button"
              onClick={() =>
                void downloadCsv(
                  `/api/ministerios/${ministry.id}/repertorio/exportar`,
                  'repertorio.csv'
                )
              }
            >
              Exportar
            </button>
          </div>
          <label className="field">
            <span>CSV</span>
            <textarea name="csv" value={csv} onChange={(event) => setCsv(event.target.value)} />
          </label>
          <button type="submit">Prévia</button>
          {preview ? (
            <ul className="list">
              {preview.map((row, index) => (
                <li key={`${row.title}-${index}`}>
                  {row.title || 'Sem título'}: {row.action === 'criar' ? 'nova' : row.reason}
                </li>
              ))}
            </ul>
          ) : null}
          {preview?.some((row) => row.action === 'criar') ? (
            <button
              type="button"
              onClick={() => {
                setSheetError('')
                void api(`/api/ministerios/${ministry.id}/repertorio/importar`, {
                  method: 'POST',
                  body: JSON.stringify({ csv }),
                })
                  .then(() => {
                    setPreview(null)
                    setCsv('')
                    return loadCatalog()
                  })
                  .catch((error: unknown) => {
                    if (error instanceof ApiError) {
                      setSheetError(error.message)
                    }
                  })
              }}
            >
              Gravar
            </button>
          ) : null}
        </form>
      ) : null}

      {!menuOpen && tab === 'musicas' ? (
        <>
          {activeFolder || artistName || query ? (
            <p className="repertoire-filter">
              <span>{activeFolder ? activeFolder.name : artistName || `“${query}”`}</span>
              <button
                type="button"
                onClick={() => {
                  setFolderId('')
                  setArtistName('')
                  setQuery('')
                  setDraft('')
                }}
              >
                Limpar
              </button>
            </p>
          ) : null}
          {songs === null ? <p className="page-loading">Carregando…</p> : null}
          {emptyCatalog ? (
            <p className="repertoire-empty">Ainda não há músicas neste repertório.</p>
          ) : null}
          {songs && visibleSongs.length === 0 && !emptyCatalog ? (
            <p className="repertoire-empty">Nenhuma música encontrada.</p>
          ) : null}
          {visibleSongs.length > 0 ? (
            <ul className="repertoire-list">
              {visibleSongs.map((song) => {
                const line = songLine(song)
                const tone = song.defaultKey?.replace(/m$/, '') ?? ''
                return (
                  <li key={song.id}>
                    <Link to={`/m/${ministry.id}/repertorio/${song.id}`} className="repertoire-row">
                      <span
                        className="repertoire-cover"
                        style={{ background: `hsl(${coverHue(song.title)} 32% 32%)` }}
                        aria-hidden="true"
                      >
                        {song.title.slice(0, 1).toLocaleUpperCase('pt')}
                      </span>
                      <span className="repertoire-copy">
                        <strong>{song.title}</strong>
                        {song.artist ? <span>{song.artist}</span> : null}
                        {line ? <em>{line}</em> : null}
                      </span>
                      <span className="repertoire-marks">
                        <Icon
                          name="alert"
                          size={14}
                          color={song.bpm ? '#e0a23a' : 'var(--muted)'}
                        />
                        <Icon name="music" size={14} color="var(--brand)" />
                        <span
                          className="repertoire-flag"
                          style={{ background: KEY_COLORS[tone] ?? 'var(--muted)' }}
                          title={song.defaultKey ? `Tom ${song.defaultKey}` : 'Sem tom'}
                        />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </>
      ) : null}

      {!menuOpen && tab === 'pastas' ? (
        folders.length === 0 ? (
          <p className="repertoire-empty">Nenhuma pasta.</p>
        ) : (
          <ul className="repertoire-list">
            {folders.map((folder) => {
              const count = (songs ?? []).filter((song) => song.folder?.id === folder.id).length
              return (
                <li key={folder.id}>
                  <button
                    type="button"
                    className="repertoire-row"
                    onClick={() => {
                      setFolderId(folder.id)
                      setArtistName('')
                      setTab('musicas')
                    }}
                  >
                    <span className="repertoire-cover repertoire-cover-plain" aria-hidden="true">
                      <Icon name="archive" size={16} />
                    </span>
                    <span className="repertoire-copy">
                      <strong>{folder.name}</strong>
                      <span>
                        {count} {count === 1 ? 'música' : 'músicas'}
                      </span>
                    </span>
                    <Icon name="chevron-right" size={16} />
                  </button>
                </li>
              )
            })}
          </ul>
        )
      ) : null}

      {!menuOpen && tab === 'artistas' ? (
        artists.length === 0 ? (
          <p className="repertoire-empty">Nenhum artista.</p>
        ) : (
          <ul className="repertoire-list">
            {artists.map(([name, count]) => (
              <li key={name}>
                <button
                  type="button"
                  className="repertoire-row"
                  onClick={() => {
                    setArtistName(name)
                    setFolderId('')
                    setTab('musicas')
                  }}
                >
                  <span className="repertoire-cover repertoire-cover-plain" aria-hidden="true">
                    {name.slice(0, 1).toLocaleUpperCase('pt')}
                  </span>
                  <span className="repertoire-copy">
                    <strong>{name}</strong>
                    <span>
                      {count} {count === 1 ? 'música' : 'músicas'}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )
      ) : null}

      {menuOpen && canManage ? (
        <>
          <CatalogSettings
            ministryId={ministry.id}
            folders={folders}
            classifications={classifications}
            onChanged={() => void loadCatalog()}
          />
        </>
      ) : null}
      </div>

      {canManage && tab === 'musicas' && !menuOpen ? (
        <Link className="notice-add" to={`/m/${ministry.id}/repertorio/nova`}>
          <Icon name="plus" size={16} color="#ffffff" /> Música
        </Link>
      ) : null}
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
        <TextField
          label="Nova pasta"
          name="folderName"
          value={folderName}
          onChange={setFolderName}
        />
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
        <button type="button" className="button-danger-outline" onClick={onDelete}>
          Excluir
        </button>
      </form>
    </li>
  )
}

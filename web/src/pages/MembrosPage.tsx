import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors } from '../components/FieldErrors.tsx'
import { Icon } from '../components/Icon.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { ClassificationItem } from '../lib/repertoire.ts'
import type { MemberItem, MinistryFunctionItem } from '../lib/ministry.ts'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

type HubTab = 'info' | 'membros'
type HubSection = 'funcoes' | 'classificacoes' | 'admins' | 'modulos' | null

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function MembrosPage() {
  const { ministry, reload } = useMinistry()
  const navigate = useNavigate()
  const [tab, setTab] = useState<HubTab>('info')
  const [section, setSection] = useState<HubSection>(null)
  const [menuId, setMenuId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [rowError, setRowError] = useState('')
  const [name, setName] = useState(ministry.name)
  const [members, setMembers] = useState<MemberItem[]>([])
  const [memberTotal, setMemberTotal] = useState(0)
  const [functions, setFunctions] = useState<MinistryFunctionItem[]>([])
  const [functionName, setFunctionName] = useState('')
  const [classifications, setClassifications] = useState<ClassificationItem[]>([])
  const [classificationName, setClassificationName] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  const canManage = ministry.membership.isAdmin || ministry.membership.canManageFunctions

  async function loadMembers(term = '') {
    const body = await api<{ members: MemberItem[] }>(
      `/api/ministerios/${ministry.id}/membros?q=${encodeURIComponent(term)}`
    )
    setMembers(body.members)
    if (!term) {
      setMemberTotal(body.members.length)
    }
  }

  async function loadFunctions() {
    const body = await api<{ functions: MinistryFunctionItem[] }>(
      `/api/ministerios/${ministry.id}/funcoes`
    )
    setFunctions(body.functions)
  }

  async function loadClassifications() {
    if (!ministry.musicModuleEnabled) {
      setClassifications([])
      return
    }
    try {
      const body = await api<{ classifications: ClassificationItem[] }>(
        `/api/ministerios/${ministry.id}/classificacoes`
      )
      setClassifications(body.classifications)
    } catch {
      setClassifications([])
    }
  }

  useEffect(() => {
    setName(ministry.name)
  }, [ministry.name])

  useEffect(() => {
    void loadMembers('')
    void loadFunctions()
    void loadClassifications()
  }, [ministry.id])

  useEffect(() => {
    if (!menuId) {
      return
    }
    function close(event: MouseEvent) {
      const target = event.target
      if (target instanceof Element && target.closest('.member-more')) {
        return
      }
      setMenuId(null)
      setConfirmRemoveId(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuId])

  async function removeMember(membershipId: string) {
    setRowError('')
    try {
      await api(`/api/ministerios/${ministry.id}/membros/${membershipId}/remover`, { method: 'POST' })
      if (membershipId === ministry.membership.id) {
        navigate('/ministerios', { replace: true })
        return
      }
      setMenuId(null)
      setConfirmRemoveId(null)
      await loadMembers('')
    } catch (error) {
      if (error instanceof ApiError) {
        setRowError(error.message)
        return
      }
      throw error
    }
  }

  async function rename(next: string) {
    const trimmed = next.trim()
    if (!ministry.membership.isAdmin || !trimmed || trimmed === ministry.name) {
      setName(ministry.name)
      return
    }
    setErrors([])
    try {
      await api(`/api/ministerios/${ministry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: trimmed,
          timezone: ministry.timezone,
          color: ministry.color,
        }),
      })
      await reload()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function createClassification(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    try {
      await api(`/api/ministerios/${ministry.id}/classificacoes`, {
        method: 'POST',
        body: JSON.stringify({ name: classificationName, description: '' }),
      })
      setClassificationName('')
      await loadClassifications()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function archiveClassification(id: string) {
    await api(`/api/ministerios/${ministry.id}/classificacoes/${id}/arquivar`, { method: 'POST' })
    await loadClassifications()
  }

  async function createFunction(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    try {
      await api(`/api/ministerios/${ministry.id}/funcoes`, {
        method: 'POST',
        body: JSON.stringify({ name: functionName }),
      })
      setFunctionName('')
      await loadFunctions()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function archive(functionId: string) {
    await api(`/api/ministerios/${ministry.id}/funcoes/${functionId}/arquivar`, { method: 'POST' })
    await loadFunctions()
    await loadMembers()
  }

  async function move(functionId: string, direction: -1 | 1) {
    const active = functions.filter((item) => !item.archived)
    const index = active.findIndex((item) => item.id === functionId)
    const next = index + direction
    if (index < 0 || next < 0 || next >= active.length) {
      return
    }
    const ids = active.map((item) => item.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(next, 0, moved)
    await api(`/api/ministerios/${ministry.id}/funcoes/ordem`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
    await loadFunctions()
  }

  const editing = members.find((member) => member.membershipId === editingId) ?? null
  const admin = ministry.membership.isAdmin
  const canClassify = admin || ministry.membership.canManageRepertoire
  const managesTrash =
    admin || ministry.membership.canManageSchedules || ministry.membership.canManageRepertoire

  return (
    <section className="page ministry-hub">
      <header className="song-top">
        {section || editingId ? (
          <button
            type="button"
            className="notice-icon-button"
            aria-label="Voltar"
            onClick={() => {
              if (editingId) {
                setEditingId(null)
                return
              }
              setSection(null)
            }}
          >
            <Icon name="x" size={18} />
          </button>
        ) : (
          <span />
        )}
        <div className="repertoire-heading">
          <h1>Ministério</h1>
          <p>{ministry.name}</p>
        </div>
        <button
          type="button"
          className="notice-icon-button"
          aria-label="Atualizar"
          onClick={() => {
            void reload()
            void loadMembers('')
            void loadFunctions()
            void loadClassifications()
          }}
        >
            <Icon name="refresh" size={16} />
        </button>
      </header>

      <div className="ministry-column">
        {section || editingId ? null : (
          <div className="repertoire-segment ministry-segment" role="tablist">
            <button type="button" role="tab" aria-selected={tab === 'info'} onClick={() => setTab('info')}>
              Informações
            </button>
            <button type="button" role="tab" aria-selected={tab === 'membros'} onClick={() => setTab('membros')}>
              Membros ({memberTotal})
            </button>
          </div>
        )}

        {section === 'funcoes' && canManage ? (
          <section className="ministry-panel">
            <h2>Funções</h2>
            <ul className="list">
              {functions
                .filter((item) => !item.archived)
                .map((item) => (
                  <li key={item.id} className="card">
                    <FunctionRow
                      ministryId={ministry.id}
                      item={item}
                      onRename={() => void loadFunctions()}
                      onMove={(direction) => void move(item.id, direction)}
                      onArchive={() => void archive(item.id)}
                    />
                  </li>
                ))}
            </ul>
            <form onSubmit={(event) => void createFunction(event)} className="form">
              <FieldErrors errors={errors} />
              <TextField label="Nova função" name="functionName" value={functionName} onChange={setFunctionName} />
              <button type="submit">Incluir</button>
            </form>
          </section>
        ) : null}

        {section === 'classificacoes' ? (
          <section className="ministry-panel">
            <h2>Classificações</h2>
            <ul className="list">
              {classifications
                .filter((item) => !item.archived)
                .map((item) => (
                  <li key={item.id} className="card ministry-class-row">
                    <strong>{item.name}</strong>
                    {canClassify ? (
                      <button type="button" onClick={() => void archiveClassification(item.id)}>
                        Arquivar
                      </button>
                    ) : null}
                  </li>
                ))}
            </ul>
            {canClassify ? (
            <form onSubmit={(event) => void createClassification(event)} className="form">
              <FieldErrors errors={errors} />
              <TextField
                label="Nova classificação"
                name="classificationName"
                value={classificationName}
                onChange={setClassificationName}
              />
              <button type="submit">Incluir</button>
            </form>
            ) : null}
          </section>
        ) : null}

        {section === 'admins' ? (
          <section className="ministry-panel">
            <h2>Administradores</h2>
            <ul className="list">
              {members.map((member) => (
                <li key={member.membershipId}>
                  <MemberCard
                    key={[member.membershipId, member.isAdmin].join(':')}
                    ministryId={ministry.id}
                    member={member}
                    functions={functions}
                    viewerIsAdmin={admin}
                    onChanged={() => void loadMembers()}
                  />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {section === 'modulos' ? (
          <section className="ministry-panel">
            <h2>Módulos</h2>
            <p className="ministry-row">
              <Icon name="music" size={18} />
              <span>
                <strong>Repertório</strong>
                <small>{ministry.musicModuleEnabled ? 'Módulo ativo' : 'Módulo desligado'}</small>
              </span>
            </p>
          </section>
        ) : null}

        {section === null && tab === 'info' ? (
          <>
            <div
              className="ministry-cover"
              style={{ '--cover': ministry.color || '#6b7280' } as React.CSSProperties}
            />
            <label className="song-input ministry-name">
              <Icon name="type" size={16} />
              <input
                name="ministryName"
                value={name}
                readOnly={!admin}
                onChange={(event) => setName(event.target.value)}
                onBlur={() => void rename(name)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void rename(name)
                  }
                }}
              />
            </label>
            <FieldErrors errors={errors} />
            {admin ? (
              <div className="ministry-menu">
                <Link to={`/m/${ministry.id}/convite`}>
                  <Icon name="invite" size={18} />
                  <span>
                    <strong>Convidar membros</strong>
                    <small>Gere novo convite</small>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </Link>
              </div>
            ) : null}
            <div className="ministry-menu">
              {canManage ? (
                <button type="button" onClick={() => setSection('funcoes')}>
                  <Icon name="sliders" size={18} />
                  <span>
                    <strong>Funções</strong>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </button>
              ) : null}
              {ministry.musicModuleEnabled ? (
                <button type="button" onClick={() => setSection('classificacoes')}>
                  <Icon name="archive" size={18} />
                  <span>
                    <strong>Classificações</strong>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </button>
              ) : null}
              {admin ? (
                <button type="button" onClick={() => setSection('admins')}>
                  <Icon name="user-check" size={18} />
                  <span>
                    <strong>Administradores</strong>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </button>
              ) : null}
              {admin ? (
                <button type="button" onClick={() => setSection('modulos')}>
                  <Icon name="settings" size={18} />
                  <span>
                    <strong>Módulos</strong>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </button>
              ) : null}
              {admin || ministry.membership.canManageSchedules ? (
                <Link to={`/m/${ministry.id}/roteiros`}>
                  <Icon name="clock" size={18} />
                  <span>
                    <strong>Modelos do roteiro</strong>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </Link>
              ) : null}
              {managesTrash ? (
                <Link to={`/m/${ministry.id}/lixeira`}>
                  <Icon name="trash" size={18} />
                  <span>
                    <strong>Lixeira</strong>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </Link>
              ) : null}
            </div>
            {admin ? (
              <section className="ministry-integrations">
                <h2>Integrações</h2>
                <Link to={`/m/${ministry.id}/integracao`}>
                  <Icon name="tokens" size={18} />
                  <span>
                    <strong>Tokens de API</strong>
                    <small>Gerenciar chaves de acesso externas (API)</small>
                  </span>
                  <Icon name="chevron-right" size={16} />
                </Link>
              </section>
            ) : null}
          </>
        ) : null}

        {section === null && tab === 'membros' && editing ? (
          <MemberCard
            key={[
              editing.membershipId,
              editing.isAdmin,
              editing.canManageSchedules,
              editing.canManageRepertoire,
              editing.canManageFunctions,
              editing.canEditScheduleSongs,
              editing.functions.map((item) => item.id).join(','),
            ].join(':')}
            ministryId={ministry.id}
            member={editing}
            functions={functions}
            viewerIsAdmin={admin}
            onChanged={() => void loadMembers()}
          />
        ) : null}

        {section === null && tab === 'membros' && !editing ? (
          <>
            {rowError ? <p className="errors">{rowError}</p> : null}
            {members.length === 0 ? <p className="empty-state-card">Nenhum membro.</p> : null}
            <ul className="member-directory">
              {members.map((member) => {
                const role = member.isAdmin
                  ? 'Administrador'
                  : member.functions.map((item) => item.name).join(', ')
                return (
                  <li key={member.membershipId} className="member-directory-row">
                    <span className="member-avatar" aria-hidden="true">
                      {initials(member.name)}
                    </span>
                    <span className="member-directory-copy">
                      <strong>{member.name}</strong>
                      {role ? <span className={member.isAdmin ? 'is-admin' : ''}>{role}</span> : null}
                    </span>
                    {admin ? (
                      <div className="member-more">
                        <button
                          type="button"
                          aria-label={`Opções de ${member.name}`}
                          aria-expanded={menuId === member.membershipId}
                          onClick={() => {
                            setRowError('')
                            setConfirmRemoveId(null)
                            setMenuId((current) =>
                              current === member.membershipId ? null : member.membershipId
                            )
                          }}
                        >
                          <Icon name="more" size={18} />
                        </button>
                        {menuId === member.membershipId ? (
                          <div className="member-menu" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                setMenuId(null)
                                setEditingId(member.membershipId)
                              }}
                            >
                              Editar
                            </button>
                            {confirmRemoveId === member.membershipId ? (
                              <button
                                type="button"
                                role="menuitem"
                                className="is-danger"
                                onClick={() => void removeMember(member.membershipId)}
                              >
                                Confirmar remoção
                              </button>
                            ) : (
                              <button
                                type="button"
                                role="menuitem"
                                className="is-danger"
                                onClick={() => setConfirmRemoveId(member.membershipId)}
                              >
                                Remover do ministério
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
            {admin ? (
              <Link className="notice-add" to={`/m/${ministry.id}/convite`}>
                <Icon name="plus" size={16} /> Adicionar
              </Link>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  )
}

function FunctionRow({
  ministryId,
  item,
  onRename,
  onMove,
  onArchive,
}: {
  ministryId: string
  item: MinistryFunctionItem
  onRename: () => void
  onMove: (direction: -1 | 1) => void
  onArchive: () => void
}) {
  const [name, setName] = useState(item.name)
  const [error, setError] = useState('')

  async function rename(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await api(`/api/ministerios/${ministryId}/funcoes/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
      onRename()
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message)
        return
      }
      throw caught
    }
  }

  return (
    <>
      <form onSubmit={(event) => void rename(event)} className="row">
        <TextField label="Nome" name={`function-${item.id}`} value={name} onChange={setName} />
        <button type="submit">Renomear</button>
      </form>
      {error ? <p className="errors">{error}</p> : null}
      <div className="row">
        <button type="button" onClick={() => onMove(-1)}>
          Subir
        </button>
        <button type="button" onClick={() => onMove(1)}>
          Descer
        </button>
        <button type="button" onClick={onArchive}>
          Arquivar
        </button>
      </div>
    </>
  )
}

function MemberCard({
  ministryId,
  member,
  functions,
  viewerIsAdmin,
  onChanged,
}: {
  ministryId: string
  member: MemberItem
  functions: MinistryFunctionItem[]
  viewerIsAdmin: boolean
  onChanged: () => void
}) {
  const [error, setError] = useState('')
  const [functionIds, setFunctionIds] = useState(member.functions.map((item) => item.id))
  const active = functions.filter((item) => !item.archived)
  const keptArchived = member.functions.filter((item) => item.archived)

  function toggle(functionId: string) {
    setFunctionIds((current) =>
      current.includes(functionId)
        ? current.filter((id) => id !== functionId)
        : [...current, functionId]
    )
  }

  async function saveFunctions(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await api(`/api/ministerios/${ministryId}/membros/${member.membershipId}/funcoes`, {
        method: 'PUT',
        body: JSON.stringify({ functionIds }),
      })
      onChanged()
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message)
        return
      }
      throw caught
    }
  }

  async function setAdmin(isAdmin: boolean) {
    setError('')
    try {
      await api(`/api/ministerios/${ministryId}/membros/${member.membershipId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAdmin }),
      })
      onChanged()
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message)
        return
      }
      throw caught
    }
  }

  async function saveFlags(event: React.FormEvent) {
    event.preventDefault()
    const form = new FormData(event.currentTarget as HTMLFormElement)
    setError('')
    try {
      await api(`/api/ministerios/${ministryId}/membros/${member.membershipId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          canManageSchedules: form.get('canManageSchedules') === 'on',
          canManageRepertoire: form.get('canManageRepertoire') === 'on',
          canManageFunctions: form.get('canManageFunctions') === 'on',
          canEditScheduleSongs: form.get('canEditScheduleSongs') === 'on',
        }),
      })
      onChanged()
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message)
        return
      }
      throw caught
    }
  }

  return (
    <article className="card">
      <strong>
        {member.name}
        {member.isAdmin ? ' · administrador' : ''}
      </strong>
      <span>
        {member.functions.length > 0
          ? member.functions.map((item) => item.name).join(', ')
          : 'Sem função'}
      </span>
      {error ? <p className="errors">{error}</p> : null}
      {viewerIsAdmin ? (
        <>
          {member.isAdmin ? (
            <button type="button" onClick={() => void setAdmin(false)}>
              Deixar de ser administrador
            </button>
          ) : (
            <button type="button" onClick={() => void setAdmin(true)}>
              Tornar administrador
            </button>
          )}
          {!member.isAdmin ? (
            <form onSubmit={(event) => void saveFlags(event)} className="checks">
              <label>
                <input
                  type="checkbox"
                  name="canManageSchedules"
                  defaultChecked={member.canManageSchedules}
                />{' '}
                Escalas
              </label>
              <label>
                <input
                  type="checkbox"
                  name="canManageRepertoire"
                  defaultChecked={member.canManageRepertoire}
                />{' '}
                Repertório
              </label>
              <label>
                <input
                  type="checkbox"
                  name="canManageFunctions"
                  defaultChecked={member.canManageFunctions}
                />{' '}
                Funções
              </label>
              <label>
                <input
                  type="checkbox"
                  name="canEditScheduleSongs"
                  defaultChecked={member.canEditScheduleSongs}
                />{' '}
                Músicas da escala
              </label>
              <button type="submit">Salvar permissões</button>
            </form>
          ) : null}
          <form onSubmit={(event) => void saveFunctions(event)} className="checks">
            {active.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={functionIds.includes(item.id)}
                  onChange={() => toggle(item.id)}
                />{' '}
                {item.name}
              </label>
            ))}
            {keptArchived.map((item) => (
              <label key={item.id}>
                <input type="checkbox" checked disabled /> {item.name}
              </label>
            ))}
            <button type="submit">Salvar funções</button>
          </form>
        </>
      ) : null}
    </article>
  )
}

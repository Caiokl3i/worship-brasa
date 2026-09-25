import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldErrors } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { MemberItem, MinistryFunctionItem } from '../lib/ministry.ts'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

export function MembrosPage() {
  const { ministry } = useMinistry()
  const [query, setQuery] = useState('')
  const [members, setMembers] = useState<MemberItem[]>([])
  const [functions, setFunctions] = useState<MinistryFunctionItem[]>([])
  const [functionName, setFunctionName] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  const canManage = ministry.membership.isAdmin || ministry.membership.canManageFunctions

  async function loadMembers(term = query) {
    const body = await api<{ members: MemberItem[] }>(
      `/api/ministerios/${ministry.id}/membros?q=${encodeURIComponent(term)}`
    )
    setMembers(body.members)
  }

  async function loadFunctions() {
    const body = await api<{ functions: MinistryFunctionItem[] }>(
      `/api/ministerios/${ministry.id}/funcoes`
    )
    setFunctions(body.functions)
  }

  useEffect(() => {
    void loadMembers('')
    void loadFunctions()
  }, [ministry.id])

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

  return (
    <section>
      <p className="eyebrow">Membros</p>
      <h1>{ministry.name}</h1>
      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault()
          void loadMembers(query)
        }}
      >
        <TextField label="Buscar por nome" name="q" value={query} onChange={setQuery} />
        <button type="submit">Buscar</button>
      </form>

      {members.length === 0 ? <p>Nenhum membro com esse nome.</p> : null}
      <ul className="list">
        {members.map((member) => (
          <li key={member.membershipId}>
            <MemberCard
              key={[
                member.membershipId,
                member.isAdmin,
                member.canManageSchedules,
                member.canManageRepertoire,
                member.canManageFunctions,
                member.canEditScheduleSongs,
                member.functions.map((item) => item.id).join(','),
              ].join(':')}
              ministryId={ministry.id}
              member={member}
              functions={functions}
              viewerIsAdmin={ministry.membership.isAdmin}
              onChanged={() => void loadMembers()}
            />
          </li>
        ))}
      </ul>

      {canManage ? (
        <section>
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

      <p>
        <Link to="..">Voltar</Link>
      </p>
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

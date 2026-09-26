import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { MemberItem } from '../lib/ministry.ts'

type UnavailabilityItem = {
  id: string
  membershipId: string
  name: string
  startsOn: string
  endsOn: string
  description: string | null
}

export function IndisponibilidadesPage() {
  const { ministry } = useMinistry()
  const canManage = ministry.membership.isAdmin || ministry.membership.canManageSchedules
  const [rows, setRows] = useState<UnavailabilityItem[] | null>(null)
  const [members, setMembers] = useState<MemberItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [membershipId, setMembershipId] = useState(ministry.membership.id)
  const [startsOn, setStartsOn] = useState('')
  const [endsOn, setEndsOn] = useState('')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])

  async function load() {
    const body = await api<{ unavailabilities: UnavailabilityItem[] }>(
      `/api/ministerios/${ministry.id}/indisponibilidades`
    )
    setRows(body.unavailabilities)
  }

  useEffect(() => {
    void load()
    if (!canManage) {
      return
    }
    void api<{ members: MemberItem[] }>(`/api/ministerios/${ministry.id}/membros`).then((body) => {
      setMembers(body.members)
    })
  }, [ministry.id, canManage])

  function reset() {
    setEditingId(null)
    setMembershipId(ministry.membership.id)
    setStartsOn('')
    setEndsOn('')
    setDescription('')
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    const payload = {
      membershipId: canManage ? membershipId : undefined,
      startsOn,
      endsOn,
      description,
    }
    try {
      if (editingId) {
        await api(`/api/ministerios/${ministry.id}/indisponibilidades/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await api(`/api/ministerios/${ministry.id}/indisponibilidades`, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }
      reset()
      await load()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function remove(id: string) {
    await api(`/api/ministerios/${ministry.id}/indisponibilidades/${id}`, { method: 'DELETE' })
    if (editingId === id) {
      reset()
    }
    await load()
  }

  const mine = rows?.filter((row) => row.membershipId === ministry.membership.id) ?? []
  const others = rows?.filter((row) => row.membershipId !== ministry.membership.id) ?? []

  return (
    <section>
      <p className="eyebrow">Indisponibilidades</p>
      <h1>{ministry.name}</h1>
      {rows === null ? <p>Carregando…</p> : null}
      {rows && rows.length === 0 ? <p>Nenhuma indisponibilidade.</p> : null}

      {mine.length > 0 ? (
        <>
          <h2>Minhas</h2>
          <ul className="list">
            {mine.map((row) => (
              <li key={row.id} className="card">
                <strong>
                  {row.startsOn} – {row.endsOn}
                </strong>
                {row.description ? <span>{row.description}</span> : null}
                <div className="row">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(row.id)
                      setMembershipId(row.membershipId)
                      setStartsOn(row.startsOn)
                      setEndsOn(row.endsOn)
                      setDescription(row.description ?? '')
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" onClick={() => void remove(row.id)}>
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {canManage && others.length > 0 ? (
        <>
          <h2>Do ministério</h2>
          <ul className="list">
            {others.map((row) => (
              <li key={row.id} className="card">
                <strong>{row.name}</strong>
                <span>
                  {row.startsOn} – {row.endsOn}
                </span>
                {row.description ? <span>{row.description}</span> : null}
                <div className="row">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(row.id)
                      setMembershipId(row.membershipId)
                      setStartsOn(row.startsOn)
                      setEndsOn(row.endsOn)
                      setDescription(row.description ?? '')
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" onClick={() => void remove(row.id)}>
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {!canManage && others.length > 0 ? (
        <>
          <h2>Equipe</h2>
          <ul className="list">
            {others.map((row) => (
              <li key={row.id} className="card">
                <strong>{row.name}</strong>
                <span>
                  Indisponível de {row.startsOn} a {row.endsOn}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <form className="form" onSubmit={(event) => void submit(event)}>
        <h2>{editingId ? 'Editar' : 'Nova'}</h2>
        <FieldErrors errors={errors} />
        {canManage ? (
          <label className="field">
            <span>Pessoa</span>
            <select
              name="membershipId"
              value={membershipId}
              disabled={editingId !== null}
              onChange={(event) => setMembershipId(event.target.value)}
            >
              {members.map((member) => (
                <option key={member.membershipId} value={member.membershipId}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <TextField
          label="Início"
          name="startsOn"
          type="date"
          value={startsOn}
          onChange={setStartsOn}
          message={fieldMessage(errors, 'startsOn')}
        />
        <TextField
          label="Término"
          name="endsOn"
          type="date"
          value={endsOn}
          onChange={setEndsOn}
          message={fieldMessage(errors, 'endsOn')}
        />
        <label className="field">
          <span>Descrição</span>
          <textarea
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="row">
          <button type="submit">{editingId ? 'Salvar' : 'Registrar'}</button>
          {editingId ? (
            <button type="button" onClick={reset}>
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
      <p>
        <Link to={`/m/${ministry.id}`}>Voltar</Link>
      </p>
    </section>
  )
}

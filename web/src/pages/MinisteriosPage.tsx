import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { MinistryList } from '../lib/ministry.ts'

export function MinisteriosPage() {
  const navigate = useNavigate()
  const [list, setList] = useState<MinistryList | null>(null)
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')

  async function load() {
    const body = await api<MinistryList>('/api/ministerios')
    setList(body)
  }

  useEffect(() => {
    void load()
  }, [])

  async function enter(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice('')

    try {
      const body = await api<{ ministryName: string }>('/api/convites/entrar', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      setNotice(`Pedido enviado para ${body.ministryName}.`)
      setCode('')
      await load()
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    }
  }

  async function cancel(membershipId: string) {
    await api(`/api/pedidos/${membershipId}`, { method: 'DELETE' })
    await load()
  }

  if (!list) {
    return <p>Carregando…</p>
  }

  const empty = list.active.length === 0 && list.pending.length === 0

  return (
    <section>
      <div className="block-head">
        <span>
          Ministérios <span className="count">{list.active.length}</span>
        </span>
        <Link to="/ministerios/novo">Adicionar +</Link>
      </div>
      {empty ? (
        <p>Você ainda não participa de um ministério. Crie um ou entre com um código de convite.</p>
      ) : null}

      {list.active.length > 0 ? (
        <ul className="ministry-row">
          {list.active.map((ministry) => (
            <li key={ministry.id}>
              <Link className="ministry-card" to={`/m/${ministry.id}`}>
                {ministry.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {list.pending.length > 0 ? (
        <ul className="list">
          {list.pending.map((request) => (
            <li key={request.membershipId} className="card">
              <span>Aguardando aprovação em {request.ministryName}.</span>
              <button type="button" onClick={() => void cancel(request.membershipId)}>
                Cancelar pedido
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={(event) => void enter(event)} className="form">
        <FieldErrors errors={errors} />
        {notice ? <p className="notice">{notice}</p> : null}
        <TextField
          label="Código do convite"
          name="code"
          value={code}
          onChange={setCode}
          message={fieldMessage(errors, 'code')}
        />
        <button type="submit">Solicitar entrada</button>
      </form>

      <p>
        <button type="button" onClick={() => navigate('/perfil')}>
          Abrir perfil
        </button>
      </p>
    </section>
  )
}

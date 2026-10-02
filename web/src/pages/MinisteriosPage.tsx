import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { TextField } from '../components/TextField.tsx'
import { Icon } from '../components/Icon.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import type { MinistryList } from '../lib/ministry.ts'

export function MinisteriosPage() {
  const navigate = useNavigate()
  const [list, setList] = useState<MinistryList | null>(null)
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')
  const [chooserOpen, setChooserOpen] = useState(false)
  const [chooserStep, setChooserStep] = useState<'choice' | 'join'>('choice')

  async function load() {
    const body = await api<MinistryList>('/api/ministerios')
    setList(body)
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    if (!chooserOpen) {
      return
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setChooserOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [chooserOpen])

  function openChooser() {
    setChooserStep('choice')
    setErrors([])
    setNotice('')
    setCode('')
    setChooserOpen(true)
  }

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
    return (
      <div className="page-loading">
        <p>Carregando ministérios…</p>
      </div>
    )
  }

  const empty = list.active.length === 0 && list.pending.length === 0

  return (
    <div className="dashboard-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Ministérios</h1>
          <p className="eyebrow">
            {list.active.length} {list.active.length === 1 ? 'ativo' : 'ativos'}
          </p>
        </div>
        <button type="button" className="button-primary-compact" onClick={openChooser}>
          <Icon name="plus" size={16} /> Novo ministério
        </button>
      </div>

      {empty ? (
        <div className="empty-state-card empty-state-large">
          <Icon name="ministry" size={32} className="empty-icon" />
          <p>Você ainda não participa de um ministério. Crie um novo ou solicite entrada via código de convite.</p>
        </div>
      ) : null}

      {list.active.length > 0 ? (
        <div className="ministry-grid">
          {list.active.map((ministry) => (
            <Link key={ministry.id} className="ministry-card-item" to={`/m/${ministry.id}`}>
              <div className="ministry-avatar" style={{ backgroundColor: ministry.color || '#2b4678' }}>
                <span>{ministry.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="ministry-card-info">
                <h4>{ministry.name}</h4>
                <span className="ministry-card-role">{ministry.musicModuleEnabled ? 'Música e Escalas' : 'Escalas'}</span>
              </div>
              <Icon name="chevron-right" size={18} className="ministry-card-arrow" />
            </Link>
          ))}
        </div>
      ) : null}

      {list.pending.length > 0 ? (
        <section className="pending-section">
          <div className="block-head">
            <span className="block-label">Solicitações Pendentes</span>
            <span className="count">{list.pending.length}</span>
          </div>
          <ul className="dashboard-card-list">
            {list.pending.map((request) => (
              <li key={request.membershipId} className="card pending-card">
                <div className="pending-info">
                  <Icon name="clock" size={18} />
                  <span>Aguardando aprovação em <strong>{request.ministryName}</strong></span>
                </div>
                <button
                  type="button"
                  className="button-outline button-small"
                  onClick={() => void cancel(request.membershipId)}
                >
                  Cancelar pedido
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="invite-section card">
        <div className="invite-header">
          <Icon name="invite" size={20} className="invite-icon" />
          <div>
            <h3>Entrar com Código de Convite</h3>
            <p className="muted-text">Recebeu um código da liderança? Digite abaixo para solicitar acesso.</p>
          </div>
        </div>

        <form onSubmit={(event) => void enter(event)} className="invite-form">
          <FieldErrors errors={errors} />
          {notice ? <p className="notice-success">{notice}</p> : null}
          <div className="invite-input-row">
            <TextField
              label="Código de convite"
              name="code"
              value={code}
              onChange={setCode}
              message={fieldMessage(errors, 'code')}
            />
            <button type="submit" className="button-primary">Solicitar entrada</button>
          </div>
        </form>
      </section>

      {chooserOpen ? (
        <div className="add-ministry-layer">
          <button
            type="button"
            className="add-ministry-close"
            aria-label="Fechar"
            onClick={() => setChooserOpen(false)}
          >
            <Icon name="x" size={22} />
          </button>
          <div
            className="add-ministry-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-ministry-title"
          >
            {chooserStep === 'choice' ? (
              <>
                <h2 id="add-ministry-title" className="add-ministry-title">
                  Adicionar ministério
                </h2>
                <p className="add-ministry-subtitle">Selecione uma opção para continuar:</p>
                <div className="add-ministry-options">
                  <button
                    type="button"
                    className="add-ministry-option"
                    onClick={() => {
                      setErrors([])
                      setNotice('')
                      setChooserStep('join')
                    }}
                  >
                    <span className="add-ministry-option-icon">
                      <Icon name="enter" size={18} />
                    </span>
                    <span className="add-ministry-option-copy">
                      <strong>Ingressar em um ministério</strong>
                      <span>Entre com o código de convite de um ministério.</span>
                    </span>
                    <Icon name="chevron-right" size={18} className="add-ministry-option-chevron" />
                  </button>
                  <button
                    type="button"
                    className="add-ministry-option"
                    onClick={() => navigate('/ministerios/novo')}
                  >
                    <span className="add-ministry-option-icon">
                      <Icon name="plus" size={18} />
                    </span>
                    <span className="add-ministry-option-copy">
                      <strong>Cadastrar novo ministério</strong>
                      <span>Crie um novo ministério para começar a organizar sua equipe.</span>
                    </span>
                    <Icon name="chevron-right" size={18} className="add-ministry-option-chevron" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="add-ministry-title" className="add-ministry-title">
                  Ingressar em um ministério
                </h2>
                <p className="add-ministry-subtitle">
                  Digite o código de convite recebido da liderança.
                </p>
                <form onSubmit={(event) => void enter(event)} className="add-ministry-join">
                  <FieldErrors errors={errors} />
                  {notice ? <p className="notice-success">{notice}</p> : null}
                  <TextField
                    label="Código de convite"
                    name="chooser-code"
                    value={code}
                    onChange={setCode}
                    message={fieldMessage(errors, 'code')}
                  />
                  <div className="add-ministry-join-actions">
                    <button type="button" className="button-outline" onClick={() => setChooserStep('choice')}>
                      Voltar
                    </button>
                    <button type="submit" className="button-primary">
                      Solicitar entrada
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

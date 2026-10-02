import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FieldErrors, fieldMessage } from '../components/FieldErrors.tsx'
import { Icon } from '../components/Icon.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'

const LOUVOR_FUNCTIONS = [
  'Ministro',
  'Vocalista',
  'Backing vocal',
  'Violão',
  'Guitarra',
  'Baixo',
  'Teclado',
  'Piano',
  'Bateria',
  'Percussão',
  'Mesa de som',
]

const FUNCTION_ICONS: Record<string, string> = {
  Ministro: '🎤',
  Vocalista: '🎤',
  Vocal: '🎤',
  'Backing vocal': '🎙️',
  Violão: '🎸',
  Guitarra: '🎸',
  Baixo: '🎸',
  Teclado: '🎹',
  Piano: '🎹',
  Bateria: '🥁',
  Percussão: '🥁',
  'Mesa de som': '🎚️',
  Projeção: '📽️',
  Som: '🎚️',
  Transmissão: '📡',
  Iluminação: '💡',
  Câmera: '📷',
}

type DraftFunction = {
  id: string
  name: string
}

type MinistryModel = {
  id: string
  name: string
  description: string
  icon: string
  music: boolean
  functions: string[]
}

const MODELS: MinistryModel[] = [
  {
    id: 'vazio',
    name: 'Vazio',
    description: 'Crie uma nova configuração do zero.',
    icon: '🖼️',
    music: false,
    functions: [],
  },
  {
    id: 'louvor',
    name: 'Louvor',
    description: 'Ministérios de música em geral, bandas e equipes de louvor.',
    icon: '🎵',
    music: true,
    functions: LOUVOR_FUNCTIONS,
  },
  {
    id: 'multimidia',
    name: 'Multimídia',
    description: 'Equipe de apoio técnico do culto.',
    icon: '🎛️',
    music: false,
    functions: [
      'Projeção',
      'Som',
      'Iluminação',
      'Câmera',
      'Switcher',
      'Transmissão',
      'Fotografia',
      'Mesa de som',
      'Retorno',
      'Operador de vídeo',
    ],
  },
  {
    id: 'transmissao',
    name: 'Transmissão / Live',
    description: 'Equipe responsável por transmissão ao vivo e captação.',
    icon: '📡',
    music: false,
    functions: [
      'Direção',
      'Câmera',
      'Switcher',
      'Transmissão',
      'Som',
      'Iluminação',
      'Projeção',
      'Moderação',
    ],
  },
  {
    id: 'comunicacao',
    name: 'Mídia / Comunicação',
    description: 'Equipe que produz conteúdo e cuida das redes sociais da igreja.',
    icon: '📱',
    music: false,
    functions: [
      'Coordenação',
      'Redes sociais',
      'Design',
      'Fotografia',
      'Filmagem',
      'Edição de vídeo',
      'Roteiro',
      'Stories',
      'Redação',
      'Transmissão',
    ],
  },
  {
    id: 'liturgia',
    name: 'Liturgia / Culto',
    description: 'Organização da condução do culto, ordem de participação e momentos litúrgicos.',
    icon: '📖',
    music: false,
    functions: [
      'Liturgista',
      'Leitura bíblica',
      'Oração',
      'Avisos',
      'Ofertas',
      'Ceia',
      'Intercessão',
      'Coordenação',
    ],
  },
  {
    id: 'recepcao',
    name: 'Recepção / Apoio',
    description: 'Recepção, apoio, organização e operação geral do culto.',
    icon: '🤝',
    music: false,
    functions: ['Recepção', 'Boas-vindas', 'Estacionamento', 'Portaria', 'Apoio', 'Coordenação'],
  },
  {
    id: 'coral',
    name: 'Coral',
    description: 'Grupo vocal, coro misto ou ministérios focados em vozes.',
    icon: '👥',
    music: true,
    functions: [
      'Regente',
      'Soprano',
      'Mezzo-soprano',
      'Contralto',
      'Tenor',
      'Barítono',
      'Baixo',
      'Solista',
      'Pianista',
    ],
  },
  {
    id: 'infantil',
    name: 'Culto infantil / Dinâmicas',
    description: 'Equipes que servem em ministério infantil ou momentos especiais.',
    icon: '🧒',
    music: false,
    functions: [
      'Coordenação',
      'Professor',
      'Auxiliar',
      'Recreação',
      'História',
      'Louvor infantil',
      'Recepção',
    ],
  },
]

const LOUVOR_MODEL = MODELS.find((item) => item.id === 'louvor') ?? MODELS[0]

function functionCountLabel(count: number) {
  return `${count} ${count === 1 || count === 0 ? 'função' : 'funções'}`
}

function draftFrom(names: string[]): DraftFunction[] {
  return names.map((name) => ({ id: crypto.randomUUID(), name }))
}

function reorder(items: DraftFunction[], fromId: string, toId: string) {
  const from = items.findIndex((item) => item.id === fromId)
  const to = items.findIndex((item) => item.id === toId)
  if (from < 0 || to < 0 || from === to) {
    return items
  }
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function NovoMinisterioPage() {
  const navigate = useNavigate()
  const editRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [model, setModel] = useState<MinistryModel>(LOUVOR_MODEL)
  const [modelOpen, setModelOpen] = useState(false)
  const [modulesOpen, setModulesOpen] = useState(false)
  const [music, setMusic] = useState(true)
  const [items, setItems] = useState<DraftFunction[]>(() => draftFrom(LOUVOR_FUNCTIONS))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [functionError, setFunctionError] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!modelOpen && !modulesOpen) {
      return
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setModelOpen(false)
        setModulesOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [modelOpen, modulesOpen])

  useEffect(() => {
    editRef.current?.focus()
  }, [editingId])

  function applyModel(next: MinistryModel) {
    setModel(next)
    setMusic(next.music)
    setItems(draftFrom(next.functions))
    setEditingId(null)
    setDraft('')
    setFunctionError('')
    setModelOpen(false)
  }

  function beginEdit(item: DraftFunction) {
    setEditingId(item.id)
    setDraft(item.name)
    setFunctionError('')
  }

  function resolveEdit(list: DraftFunction[]) {
    if (!editingId) {
      return { items: list, error: '' }
    }
    const trimmed = draft.trim()
    const current = list.find((item) => item.id === editingId)
    if (!trimmed) {
      return {
        items: current?.name ? list : list.filter((item) => item.id !== editingId),
        error: '',
      }
    }
    const duplicate = list.some(
      (item) => item.id !== editingId && item.name.toLowerCase() === trimmed.toLowerCase()
    )
    if (duplicate) {
      return { items: list, error: 'Já existe uma função com esse nome.' }
    }
    return {
      items: list.map((item) => (item.id === editingId ? { ...item, name: trimmed } : item)),
      error: '',
    }
  }

  function commitEdit() {
    const resolved = resolveEdit(items)
    setItems(resolved.items)
    setFunctionError(resolved.error)
    if (!resolved.error) {
      setEditingId(null)
    }
  }

  function addFunction() {
    const pending = items.find((item) => item.name === '')
    if (pending) {
      beginEdit(pending)
      return
    }
    const id = crypto.randomUUID()
    setItems((list) => [...list, { id, name: '' }])
    setEditingId(id)
    setDraft('')
    setFunctionError('')
  }

  function removeFunction(id: string) {
    setItems((list) => list.filter((item) => item.id !== id))
    if (editingId === id) {
      setEditingId(null)
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const resolved = resolveEdit(items)
    if (resolved.error) {
      setFunctionError(resolved.error)
      return
    }
    setItems(resolved.items)
    setEditingId(null)
    setFunctionError('')
    setErrors([])
    setSaving(true)
    try {
      const ministry = await api<{ id: string }>('/api/ministerios', {
        method: 'POST',
        body: JSON.stringify({
          name,
          functions: resolved.items.map((item) => item.name).filter((item) => item.trim()),
          musicModuleEnabled: music,
        }),
      })
      navigate(`/m/${ministry.id}`, { replace: true })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        return
      }
      throw error
    } finally {
      setSaving(false)
    }
  }

  const nameMessage = fieldMessage(errors, 'name')

  return (
    <section className="page ministry-setup">
      <h1>Novo ministério</h1>
      <form onSubmit={(event) => void submit(event)} className="ministry-setup-form">
        <FieldErrors errors={errors} />
        <input
          className="ministry-setup-name"
          name="name"
          value={name}
          placeholder="Nome do ministério *"
          aria-label="Nome do ministério"
          aria-invalid={nameMessage ? true : undefined}
          onChange={(event) => setName(event.target.value)}
        />
        {nameMessage ? <small className="field-error-msg">{nameMessage}</small> : null}

        <div className="setup-block">
          <h2>Modelo de ministério</h2>
          <p>Selecione uma configuração inicial para o ministério</p>
          <div className="model-picker">
            <button
              type="button"
              className="model-select"
              aria-haspopup="dialog"
              aria-expanded={modelOpen}
              onClick={() => setModelOpen(true)}
            >
              <span className="model-select-icon" aria-hidden="true">
                {model.icon}
              </span>
              <span className="model-select-copy">
                <strong>{model.name}</strong>
                <span>{model.description}</span>
              </span>
              <Icon name="chevron-right" size={18} className="model-chevron" />
            </button>
          </div>
        </div>

        <div className="setup-card">
          <div className="setup-module">
            <div>
              <h2>
                Módulos <span className="setup-count">1</span>
              </h2>
              <span>Repertório</span>
            </div>
            <button
              type="button"
              className="setup-modules-button"
              aria-label="Configurar módulos"
              onClick={() => setModulesOpen(true)}
            >
              <Icon name="sliders" size={16} />
            </button>
          </div>

          <div className="setup-card-head">
            <h2>
              Funções <span className="setup-count">{items.length}</span>
            </h2>
            <p>Defina os papéis que os membros poderão assumir neste ministério</p>
          </div>

          <button type="button" className="setup-add" onClick={addFunction}>
            <Icon name="plus" size={16} /> Adicionar função
          </button>
          {functionError ? <small className="field-error-msg">{functionError}</small> : null}

          <ul className="setup-functions">
            {items.map((item) => (
              <li
                key={item.id}
                data-function-id={item.id}
                className={dragId === item.id ? 'is-dragging' : undefined}
              >
                <button
                  type="button"
                  className="setup-grip"
                  aria-label={`Mover ${item.name || 'função'}`}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId)
                    setDragId(item.id)
                  }}
                  onPointerMove={(event) => {
                    if (dragId !== item.id) {
                      return
                    }
                    const under = document.elementFromPoint(event.clientX, event.clientY)
                    const targetId = under?.closest<HTMLElement>('[data-function-id]')?.dataset.functionId
                    if (!targetId) {
                      return
                    }
                    setItems((list) => reorder(list, item.id, targetId))
                  }}
                  onPointerUp={() => setDragId(null)}
                  onPointerCancel={() => setDragId(null)}
                >
                  <Icon name="grip" size={16} />
                </button>
                <span className="setup-function-icon" aria-hidden="true">
                  {FUNCTION_ICONS[item.name] ?? '🎵'}
                </span>
                {editingId === item.id ? (
                  <input
                    ref={editRef}
                    className="setup-function-edit"
                    value={draft}
                    aria-label="Nome da função"
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        commitEdit()
                      }
                      if (event.key === 'Escape') {
                        event.preventDefault()
                        if (!item.name) {
                          removeFunction(item.id)
                        }
                        setEditingId(null)
                      }
                    }}
                  />
                ) : (
                  <span className="setup-function-name">{item.name}</span>
                )}
                <button
                  type="button"
                  className="setup-icon"
                  aria-label={`Editar ${item.name || 'função'}`}
                  onClick={() => beginEdit(item)}
                >
                  <Icon name="pencil" size={15} />
                </button>
                <button
                  type="button"
                  className="setup-icon"
                  aria-label={`Remover ${item.name || 'função'}`}
                  onClick={() => removeFunction(item.id)}
                >
                  <Icon name="trash" size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button type="submit" className="button-primary ministry-setup-submit" disabled={saving}>
          {saving ? 'Criando…' : 'Criar ministério'}
        </button>
      </form>

      {modelOpen ? (
        <div className="model-dialog-layer" onMouseDown={() => setModelOpen(false)}>
          <div
            className="model-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="model-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="model-dialog-head">
              <h2 id="model-dialog-title">Selecionar modelo</h2>
              <button type="button" className="model-dialog-close" aria-label="Fechar" onClick={() => setModelOpen(false)}>
                <Icon name="x" size={18} />
              </button>
            </header>
            <ul className="model-dialog-list">
              {MODELS.map((option) => {
                const selected = option.id === model.id
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      className="model-option"
                      aria-pressed={selected}
                      onClick={() => applyModel(option)}
                    >
                      <span className="model-option-icon" aria-hidden="true">
                        {option.icon}
                      </span>
                      <span className="model-option-copy">
                        <strong>{option.name}</strong>
                        <span>{option.description}</span>
                        <span className="model-option-count">{functionCountLabel(option.functions.length)}</span>
                      </span>
                      <span className={`model-radio${selected ? ' is-selected' : ''}`} aria-hidden="true">
                        {selected ? <Icon name="check" size={14} /> : null}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <footer className="model-dialog-foot">
              <button type="button" className="model-cancel" onClick={() => setModelOpen(false)}>
                Cancelar
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      {modulesOpen ? (
        <div className="modules-layer">
          <header className="modules-head">
            <button type="button" className="modules-back" aria-label="Voltar" onClick={() => setModulesOpen(false)}>
              <Icon name="chevron-right" size={20} className="modules-back-icon" />
            </button>
            <h1>Módulos</h1>
          </header>
          <div className="modules-card">
            <div className="modules-card-head">
              <strong>Músicas</strong>
              <button
                type="button"
                className="setup-switch"
                role="switch"
                aria-checked={music}
                aria-label="Músicas"
                onClick={() => setMusic((current) => !current)}
              />
            </div>
            <p>
              Ao desativar este módulo, todos os recursos relacionados a músicas ficarão ocultos para os
              membros deste ministério.
            </p>
            <ul>
              <li>Aba de repertório</li>
              <li>Músicas nas escalas</li>
              <li>Relatórios de músicas</li>
              <li>Metrônomo</li>
              <li>Classificações de músicas</li>
            </ul>
            <p>
              Esta opção é recomendada para ministérios que não utilizam músicas em suas escalas, como
              multimídia, transmissão (live), iluminação, projeção, entre outros.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  )
}

import { fieldMessage } from './FieldErrors.tsx'
import { TextField } from './TextField.tsx'
import type { FieldError } from '../lib/api.ts'
import { formatDuration } from '../lib/repertoire.ts'
import type { ScriptItemView, ScriptTemplateView } from '../lib/schedule.ts'

const SONG_BLOCK = 'Louvor'

function groupsOf(items: ScriptItemView[]) {
  const groups: ScriptItemView[][] = []
  for (const item of items) {
    const last = groups.at(-1)
    if (item.locked && last?.[0]?.locked) {
      last.push(item)
    } else {
      groups.push([item])
    }
  }
  return groups
}

function moveScriptGroup(items: ScriptItemView[], index: number, delta: number) {
  const groups = groupsOf(items)
  const groupIndex = groups.findIndex((group) => group.includes(items[index]))
  const next = groupIndex + delta
  if (groupIndex < 0 || next < 0 || next >= groups.length) {
    return items
  }
  const copy = [...groups]
  const [moved] = copy.splice(groupIndex, 1)
  copy.splice(next, 0, moved)
  return copy.flat()
}

function hasSongBlock(items: ScriptItemView[]) {
  return items.some(
    (item) =>
      item.locked || item.title.trim().toLocaleLowerCase('pt-BR') === SONG_BLOCK.toLocaleLowerCase('pt-BR')
  )
}

function durationLabel(seconds: number | null) {
  if (seconds === null) {
    return 'Sem duração informada.'
  }
  return `Duração prevista: ${formatDuration(seconds)}.`
}

function knownTotal(items: ScriptItemView[]) {
  const known = items
    .map((item) => item.durationSeconds)
    .filter((value): value is number => value !== null)
  if (known.length === 0) {
    return null
  }
  return known.reduce((total, value) => total + value, 0)
}

export function ScriptEditor({
  items,
  canManage,
  templates,
  templateId,
  errors,
  onChange,
  onTemplateId,
  onSave,
  onApply,
}: {
  items: ScriptItemView[]
  canManage: boolean
  templates: ScriptTemplateView[]
  templateId: string
  errors: FieldError[]
  onChange: (items: ScriptItemView[]) => void
  onTemplateId: (id: string) => void
  onSave: () => void
  onApply: () => void
}) {
  function update(index: number, patch: Partial<ScriptItemView>) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  return (
    <div>
      <p>{durationLabel(knownTotal(items))}</p>
      <ol className="list">
        {items.map((item, index) => (
          <li key={item.id} className="card">
            {item.locked ? (
              <>
                <strong>{item.title}</strong>
                {item.effectiveKey ? <span> Tom {item.effectiveKey}</span> : null}
                {item.durationSeconds ? <span> {formatDuration(item.durationSeconds)}</span> : null}
                {item.notes ? <p>{item.notes}</p> : null}
                <p>Para mudar a ordem, vá na aba Músicas.</p>
              </>
            ) : canManage ? (
              <>
                <TextField
                  label="Título"
                  name={`script-title-${index}`}
                  value={item.title}
                  message={fieldMessage(errors, `items.${index}.title`)}
                  onChange={(value) => update(index, { title: value })}
                />
                <label className="field">
                  <span>Observação</span>
                  <textarea
                    value={item.notes}
                    onChange={(event) => update(index, { notes: event.target.value })}
                  />
                </label>
                <TextField
                  label="Duração (segundos)"
                  name={`script-duration-${index}`}
                  value={item.durationSeconds === null ? '' : String(item.durationSeconds)}
                  message={fieldMessage(errors, `items.${index}.durationSeconds`)}
                  onChange={(value) =>
                    update(index, {
                      durationSeconds: value.trim() === '' ? null : Number(value),
                    })
                  }
                />
              </>
            ) : (
              <>
                <strong>{item.title}</strong>
                {item.durationSeconds ? <span> {formatDuration(item.durationSeconds)}</span> : null}
                {item.notes ? <p>{item.notes}</p> : null}
              </>
            )}
            {canManage ? (
              <div className="row">
                <button type="button" onClick={() => onChange(moveScriptGroup(items, index, -1))}>
                  Subir
                </button>
                <button type="button" onClick={() => onChange(moveScriptGroup(items, index, 1))}>
                  Descer
                </button>
                {item.locked ? null : (
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                  >
                    Remover
                  </button>
                )}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {canManage ? (
        <div className="form">
          <div className="row">
            <button
              type="button"
              onClick={() =>
                onChange([
                  ...items,
                  {
                    id: crypto.randomUUID(),
                    position: items.length + 1,
                    title: '',
                    notes: '',
                    durationSeconds: null,
                    source: 'manual',
                    effectiveKey: null,
                    locked: false,
                  },
                ])
              }
            >
              Incluir item
            </button>
            {hasSongBlock(items) ? null : (
              <button
                type="button"
                onClick={() =>
                  onChange([
                    ...items,
                    {
                      id: crypto.randomUUID(),
                      position: items.length + 1,
                      title: SONG_BLOCK,
                      notes: '',
                      durationSeconds: null,
                      source: 'songs',
                      effectiveKey: null,
                      locked: true,
                    },
                  ])
                }
              >
                Incluir bloco de louvor
              </button>
            )}
            <button type="button" onClick={onSave}>
              Salvar roteiro
            </button>
          </div>
          <label className="field">
            <span>Modelo</span>
            <select value={templateId} onChange={(event) => onTemplateId(event.target.value)}>
              <option value="">Escolha um modelo</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={onApply} disabled={templateId === ''}>
            Aplicar modelo
          </button>
        </div>
      ) : null}
    </div>
  )
}

import { useState } from 'react'
import { FieldErrors } from './FieldErrors.tsx'
import { ApiError, type FieldError } from '../lib/api.ts'
import {
  SHARE_PRESETS,
  downloadScheduleImage,
  loadScheduleText,
  shareBody,
  type ShareFlags,
  type SharePreset,
} from '../lib/share.ts'

const PRESET_LABELS: Array<[SharePreset, string]> = [
  ['completa', 'Completa'],
  ['resumida', 'Resumida'],
  ['participantes', 'Só participantes'],
  ['musicas', 'Só músicas'],
]

const FLAG_LABELS: Array<[keyof ShareFlags, string]> = [
  ['functions', 'Funções'],
  ['confirmations', 'Confirmação'],
  ['keys', 'Tom'],
  ['minister', 'Ministro em destaque'],
  ['links', 'Links'],
  ['notes', 'Observações'],
  ['dressCode', 'Vestimenta'],
  ['confirmedOnly', 'Apenas confirmados'],
  ['bold', 'Negrito'],
]

export function SharePanel({ ministryId, scheduleId }: { ministryId: string; scheduleId: string }) {
  const [preset, setPreset] = useState<SharePreset>('completa')
  const [flags, setFlags] = useState<ShareFlags>(SHARE_PRESETS.completa)
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')

  function choosePreset(next: SharePreset) {
    setPreset(next)
    setFlags(SHARE_PRESETS[next])
    setText('')
  }

  async function showText() {
    setErrors([])
    setNotice('')
    try {
      const body = await loadScheduleText(ministryId, scheduleId, shareBody(preset, flags))
      setText(body.text)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  async function copyText() {
    setErrors([])
    setNotice('')
    try {
      await navigator.clipboard.writeText(text)
      setNotice('Texto copiado.')
    } catch {
      setNotice('Não foi possível copiar. Selecione o texto.')
    }
  }

  async function download() {
    setErrors([])
    setNotice('')
    try {
      await downloadScheduleImage(ministryId, scheduleId)
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  return (
    <div className="form">
      <h2>Compartilhar</h2>
      <FieldErrors errors={errors} />
      {notice ? <p className="notice">{notice}</p> : null}
      <label className="field">
        <span>Modelo</span>
        <select
          aria-label="Modelo"
          value={preset}
          onChange={(event) => choosePreset(event.target.value as SharePreset)}
        >
          {PRESET_LABELS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="checks">
        <legend>Opções</legend>
        {FLAG_LABELS.map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={flags[key]}
              onChange={(event) =>
                setFlags((current) => ({ ...current, [key]: event.target.checked }))
              }
            />{' '}
            {label}
          </label>
        ))}
      </fieldset>
      <div className="row">
        <button type="button" onClick={() => void showText()}>
          Ver texto
        </button>
        <button type="button" onClick={() => void copyText()} disabled={text.length === 0}>
          Copiar
        </button>
        <button type="button" onClick={() => void download()}>
          Baixar imagem
        </button>
      </div>
      {text ? <textarea readOnly value={text} rows={12} aria-label="Texto da escala" /> : null}
    </div>
  )
}

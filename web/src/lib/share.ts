import { api, ApiError, type FieldError } from './api.ts'

const apiUrl = import.meta.env.VITE_API_URL

export type SharePreset = 'completa' | 'resumida' | 'participantes' | 'musicas'

export type ShareFlags = {
  bold: boolean
  functions: boolean
  confirmations: boolean
  keys: boolean
  minister: boolean
  links: boolean
  notes: boolean
  dressCode: boolean
  confirmedOnly: boolean
}

export const SHARE_PRESETS: Record<SharePreset, ShareFlags> = {
  completa: {
    bold: false,
    functions: true,
    confirmations: true,
    keys: true,
    minister: true,
    links: true,
    notes: true,
    dressCode: true,
    confirmedOnly: false,
  },
  resumida: {
    bold: false,
    functions: true,
    confirmations: false,
    keys: true,
    minister: false,
    links: false,
    notes: false,
    dressCode: false,
    confirmedOnly: false,
  },
  participantes: {
    bold: false,
    functions: true,
    confirmations: false,
    keys: false,
    minister: false,
    links: false,
    notes: false,
    dressCode: false,
    confirmedOnly: false,
  },
  musicas: {
    bold: false,
    functions: false,
    confirmations: false,
    keys: true,
    minister: false,
    links: false,
    notes: false,
    dressCode: false,
    confirmedOnly: false,
  },
}

export function shareBody(preset: SharePreset, flags: ShareFlags) {
  return { preset, ...flags }
}

export async function downloadScheduleImage(ministryId: string, scheduleId: string) {
  const response = await fetch(
    `${apiUrl}/api/ministerios/${ministryId}/escalas/${scheduleId}/imagem`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }
  )
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      errors?: FieldError[]
      message?: string
    } | null
    const errors = [...(body?.errors ?? [])]
    if (errors.length === 0 && body?.message) {
      errors.push({ field: 'form', message: body.message })
    }
    throw new ApiError(response.status, errors)
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'escala.svg'
  link.click()
  URL.revokeObjectURL(url)
}

export async function loadScheduleText(ministryId: string, scheduleId: string, body: object) {
  return api<{ text: string }>(`/api/ministerios/${ministryId}/escalas/${scheduleId}/texto`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

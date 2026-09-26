import { ApiError, type FieldError } from './api.ts'

const apiUrl = import.meta.env.VITE_API_URL

export async function downloadCsv(path: string, filename: string) {
  const response = await fetch(`${apiUrl}${path}`, { credentials: 'include' })
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
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

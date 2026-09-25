const apiUrl = import.meta.env.VITE_API_URL

export type HealthResponse = {
  status: 'ok'
  timezone: string
}

export type PublicUser = {
  id: string
  name: string
  email: string
  birthDate: string | null
}

export type FieldError = {
  field: string
  message: string
}

export class ApiError extends Error {
  status: number
  errors: FieldError[]

  constructor(status: number, errors: FieldError[]) {
    super(errors[0]?.message ?? 'Não foi possível concluir.')
    this.status = status
    this.errors = errors
  }
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${apiUrl}/health`, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('A API não respondeu.')
  }

  return response.json() as Promise<HealthResponse>
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (response.status === 204) {
    return undefined as T
  }

  const body = (await response.json().catch(() => null)) as
    | (T & { errors?: FieldError[]; message?: string })
    | null

  if (!response.ok) {
    const errors = [...(body?.errors ?? [])]
    if (errors.length === 0 && body?.message) {
      errors.push({ field: 'form', message: body.message })
    }
    throw new ApiError(response.status, errors)
  }

  return body as T
}

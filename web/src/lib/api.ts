const apiUrl = import.meta.env.VITE_API_URL

export type HealthResponse = {
  status: 'ok'
  timezone: string
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


import env from '#start/env'
import type { CalendarEventBody, CalendarGateway } from '#services/calendar_gateway'

const SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  error?: string
}

export function calendarRedirectUri() {
  return env.get('GOOGLE_REDIRECT_URI') || `${env.get('APP_URL')}/api/agenda/retorno`
}

export function webOrigin() {
  return env.get('WEB_URL') || 'http://localhost:5173'
}

export function calendarAuthorizationUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.get('GOOGLE_CLIENT_ID') ?? '',
    redirect_uri: calendarRedirectUri(),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeCalendarCode(code: string) {
  const body = await tokenRequest({
    code,
    grant_type: 'authorization_code',
    redirect_uri: calendarRedirectUri(),
  })
  if (!body.refresh_token) {
    throw new Error('O Google não devolveu o token de renovação.')
  }
  return body.refresh_token
}

export class GoogleCalendarGateway implements CalendarGateway {
  #access = new Map<string, { token: string; at: number }>()

  async createCalendar(refreshToken: string, summary: string) {
    const created = await this.#json<{ id: string }>(refreshToken, 'POST', '/calendars', {
      summary,
    })
    return created.id
  }

  async createEvent(refreshToken: string, calendarId: string, event: CalendarEventBody) {
    const created = await this.#json<{ id: string }>(
      refreshToken,
      'POST',
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      googleEvent(event)
    )
    return created.id
  }

  async updateEvent(
    refreshToken: string,
    calendarId: string,
    externalId: string,
    event: CalendarEventBody
  ) {
    await this.#json(
      refreshToken,
      'PUT',
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(externalId)}`,
      googleEvent(event)
    )
  }

  async deleteEvent(refreshToken: string, calendarId: string, externalId: string) {
    await this.#send(
      refreshToken,
      'DELETE',
      `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(externalId)}`
    )
  }

  async #json<T>(refreshToken: string, method: string, path: string, body: unknown) {
    const response = await this.#send(refreshToken, method, path, body)
    return (await response.json()) as T
  }

  async #send(refreshToken: string, method: string, path: string, body?: unknown) {
    const access = await this.#accessToken(refreshToken)
    const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) {
      throw new Error(`Google Agenda respondeu ${response.status}.`)
    }
    return response
  }

  async #accessToken(refreshToken: string) {
    const cached = this.#access.get(refreshToken)
    if (cached && Date.now() - cached.at < 50 * 60 * 1000) {
      return cached.token
    }
    const body = await tokenRequest({
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })
    if (!body.access_token) {
      throw new Error('O Google não renovou o acesso à agenda.')
    }
    this.#access.set(refreshToken, { token: body.access_token, at: Date.now() })
    return body.access_token
  }
}

async function tokenRequest(fields: Record<string, string>) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.get('GOOGLE_CLIENT_ID') ?? '',
      client_secret: env.get('GOOGLE_CLIENT_SECRET') ?? '',
      ...fields,
    }),
  })
  const body = (await response.json()) as TokenResponse
  if (!response.ok) {
    throw new Error(body.error || 'O Google recusou a conexão.')
  }
  return body
}

function googleEvent(event: CalendarEventBody) {
  return {
    summary: event.title,
    description: event.description,
    start: { dateTime: event.startsAt, timeZone: event.timeZone },
    end: { dateTime: event.endsAt, timeZone: event.timeZone },
  }
}

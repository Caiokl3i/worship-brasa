import env from '#start/env'
import { googleConfigured } from '#services/calendar_gateway'
import { webOrigin } from '#services/calendar_google'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo'

export type GoogleIdentity = {
  email: string
  emailVerified: boolean
}

export interface GoogleIdentityVerifier {
  exchange(code: string): Promise<GoogleIdentity | null>
}

class GoogleHttpVerifier implements GoogleIdentityVerifier {
  async exchange(code: string) {
    const token = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.get('GOOGLE_CLIENT_ID') ?? '',
        client_secret: env.get('GOOGLE_CLIENT_SECRET') ?? '',
        redirect_uri: googleLoginRedirectUri(),
        grant_type: 'authorization_code',
      }),
    })
    const body = (await token.json()) as { access_token?: string }
    if (!body.access_token) {
      return null
    }

    const info = await fetch(USERINFO_URL, {
      headers: { authorization: `Bearer ${body.access_token}` },
    })
    const profile = (await info.json()) as { email?: string; email_verified?: boolean }
    if (!profile.email) {
      return null
    }
    return { email: profile.email, emailVerified: profile.email_verified === true }
  }
}

let current: GoogleIdentityVerifier | null = null

export function setGoogleIdentityVerifier(next: GoogleIdentityVerifier | null) {
  current = next
}

export function googleLoginConfigured() {
  return current !== null || googleConfigured()
}

export function getGoogleIdentityVerifier() {
  return current ?? new GoogleHttpVerifier()
}

export function googleLoginRedirectUri() {
  return `${env.get('APP_URL')}/api/entrar/google/retorno`
}

export function googleLoginUrl(state: string) {
  const params = new URLSearchParams({
    client_id: env.get('GOOGLE_CLIENT_ID') ?? '',
    redirect_uri: googleLoginRedirectUri(),
    response_type: 'code',
    scope: 'openid email',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export function googleLoginErrorUrl() {
  return `${webOrigin()}/entrar?google=desconhecido`
}

export class MemoryGoogleIdentities implements GoogleIdentityVerifier {
  constructor(private rows: Array<{ code: string } & GoogleIdentity>) {}

  async exchange(code: string) {
    const row = this.rows.find((item) => item.code === code)
    return row ? { email: row.email, emailVerified: row.emailVerified } : null
  }
}

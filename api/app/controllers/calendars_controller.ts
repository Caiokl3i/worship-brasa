import { randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import {
  calendarAuthorizationUrl,
  exchangeCalendarCode,
  webOrigin,
} from '#services/calendar_google'
import { googleConfigured } from '#services/calendar_gateway'
import {
  calendarStatus,
  connectCalendar,
  connectLocalCalendar,
  disconnectCalendar,
} from '#services/calendar_sync'

export default class CalendarsController {
  async show({ auth, response }: HttpContext) {
    return response.ok(await calendarStatus(auth.getUserOrFail().id))
  }

  async store({ auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!googleConfigured()) {
      await connectLocalCalendar(user.id)
      return response.ok({ connected: true })
    }

    const state = randomBytes(16).toString('hex')
    session.put('calendar_oauth_state', state)
    return response.ok({ connected: false, url: calendarAuthorizationUrl(state) })
  }

  async callback({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const state = request.input('state')
    const code = request.input('code')
    const expected = session.get('calendar_oauth_state')
    session.forget('calendar_oauth_state')

    if (!state || state !== expected || !code) {
      return response.redirect(`${webOrigin()}/perfil?agenda=erro`)
    }

    const refreshToken = await exchangeCalendarCode(code)
    await connectCalendar(user.id, refreshToken)
    return response.redirect(`${webOrigin()}/perfil?agenda=conectada`)
  }

  async destroy({ auth, response }: HttpContext) {
    await disconnectCalendar(auth.getUserOrFail().id)
    return response.ok({ connected: false })
  }
}

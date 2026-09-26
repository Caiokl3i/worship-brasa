import { randomUUID } from 'node:crypto'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { GoogleCalendarGateway } from '#services/calendar_google'

export type CalendarEventBody = {
  title: string
  description: string
  startsAt: string
  endsAt: string
  timeZone: string
}

export type CalendarCall =
  | { op: 'calendar'; calendarId: string }
  | {
      op: 'create' | 'update'
      calendarId: string
      externalId: string
      title: string
      startsAt: string
    }
  | { op: 'delete'; calendarId: string; externalId: string }

export interface CalendarGateway {
  createCalendar(refreshToken: string, summary: string): Promise<string>
  createEvent(refreshToken: string, calendarId: string, event: CalendarEventBody): Promise<string>
  updateEvent(
    refreshToken: string,
    calendarId: string,
    externalId: string,
    event: CalendarEventBody
  ): Promise<void>
  deleteEvent(refreshToken: string, calendarId: string, externalId: string): Promise<void>
}

class LogCalendarGateway implements CalendarGateway {
  async createCalendar(_refreshToken: string, summary: string) {
    const calendarId = `local-${randomUUID()}`
    logger.info(`[agenda] calendário ${summary} ${calendarId}`)
    return calendarId
  }

  async createEvent(_refreshToken: string, calendarId: string, event: CalendarEventBody) {
    const externalId = `local-${randomUUID()}`
    logger.info(`[agenda] criado ${calendarId} ${externalId} ${event.title}`)
    return externalId
  }

  async updateEvent(
    _refreshToken: string,
    calendarId: string,
    externalId: string,
    event: CalendarEventBody
  ) {
    logger.info(`[agenda] atualizado ${calendarId} ${externalId} ${event.title}`)
  }

  async deleteEvent(_refreshToken: string, calendarId: string, externalId: string) {
    logger.info(`[agenda] removido ${calendarId} ${externalId}`)
  }
}

export class MemoryCalendarGateway implements CalendarGateway {
  calls: CalendarCall[] = []
  #next = 1

  async createCalendar() {
    const calendarId = `cal-${this.#next++}`
    this.calls.push({ op: 'calendar', calendarId })
    return calendarId
  }

  async createEvent(_refreshToken: string, calendarId: string, event: CalendarEventBody) {
    const externalId = `evt-${this.#next++}`
    this.calls.push({
      op: 'create',
      calendarId,
      externalId,
      title: event.title,
      startsAt: event.startsAt,
    })
    return externalId
  }

  async updateEvent(
    _refreshToken: string,
    calendarId: string,
    externalId: string,
    event: CalendarEventBody
  ) {
    this.calls.push({
      op: 'update',
      calendarId,
      externalId,
      title: event.title,
      startsAt: event.startsAt,
    })
  }

  async deleteEvent(_refreshToken: string, calendarId: string, externalId: string) {
    this.calls.push({ op: 'delete', calendarId, externalId })
  }
}

const logGateway = new LogCalendarGateway()
let googleGateway: GoogleCalendarGateway | null = null
let override: CalendarGateway | null = null

export function googleConfigured() {
  return Boolean(env.get('GOOGLE_CLIENT_ID') && env.get('GOOGLE_CLIENT_SECRET'))
}

export function getCalendarGateway() {
  if (override) {
    return override
  }
  if (!googleConfigured()) {
    return logGateway
  }
  googleGateway ??= new GoogleCalendarGateway()
  return googleGateway
}

export function setCalendarGateway(next: CalendarGateway | null) {
  override = next
}

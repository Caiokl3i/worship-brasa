import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import CalendarConnection from '#models/calendar_connection'
import CalendarEventLink from '#models/calendar_event_link'
import Membership from '#models/membership'
import Ministry from '#models/ministry'
import Schedule from '#models/schedule'
import ScheduleParticipant from '#models/schedule_participant'
import type { ScheduleSnap, SeriesEffect } from '#notifications/effects'
import { getCalendarGateway, type CalendarEventBody } from '#services/calendar_gateway'

const LOCAL_REFRESH_TOKEN = 'local'

export async function syncCalendarEffects(effects: SeriesEffect[]) {
  for (const effect of effects) {
    if (effect.kind === 'deleted') {
      await guard(() => clearSchedule(effect.before.id))
      continue
    }
    if (effect.kind === 'team_trimmed') {
      await guard(() => dropMembers(effect.before, effect.removedMembershipIds))
      continue
    }
    await guard(() => syncSaved(effect.after))
  }
}

export async function connectCalendar(userId: string, refreshToken: string) {
  const gateway = getCalendarGateway()
  let connection = await CalendarConnection.findBy('userId', userId)
  if (!connection) {
    const calendarId = await gateway.createCalendar(refreshToken, 'Worship Brasa')
    connection = await CalendarConnection.create({
      userId,
      calendarId,
      refreshToken,
      disconnectedAt: null,
    })
  } else {
    connection.refreshToken = refreshToken
    connection.disconnectedAt = null
    await connection.save()
  }

  await backfill(connection)
  return connection
}

export function connectLocalCalendar(userId: string) {
  return connectCalendar(userId, LOCAL_REFRESH_TOKEN)
}

export async function disconnectCalendar(userId: string) {
  const connection = await activeConnection(userId)
  if (!connection?.refreshToken) {
    return
  }

  const links = await CalendarEventLink.query().where('userId', userId)
  const scheduleIds = links.map((link) => link.scheduleId)
  const schedules =
    scheduleIds.length === 0
      ? []
      : await Schedule.query().whereIn('id', scheduleIds).select('id', 'startsAt')
  const future = new Set(
    schedules
      .filter((schedule) => schedule.startsAt > DateTime.utc())
      .map((schedule) => schedule.id)
  )
  const gateway = getCalendarGateway()

  for (const link of links) {
    if (!future.has(link.scheduleId)) {
      continue
    }
    await gateway.deleteEvent(connection.refreshToken, connection.calendarId, link.externalId)
    await link.delete()
  }

  connection.disconnectedAt = DateTime.utc()
  connection.refreshToken = null
  await connection.save()
}

export async function calendarStatus(userId: string) {
  const connection = await activeConnection(userId)
  return { connected: Boolean(connection?.refreshToken) }
}

async function backfill(connection: CalendarConnection) {
  const memberships = await Membership.query()
    .where('userId', connection.userId)
    .where('status', 'active')
  if (memberships.length === 0) {
    return
  }

  const participants = await ScheduleParticipant.query()
    .whereIn(
      'membershipId',
      memberships.map((membership) => membership.id)
    )
    .preload('schedule')

  for (const participant of participants) {
    const schedule = participant.schedule
    if (schedule.status !== 'published' || schedule.deletedAt) {
      continue
    }
    await upsert(connection, await snapOf(schedule))
  }
}

async function syncSaved(after: ScheduleSnap) {
  if (after.status !== 'published') {
    await clearSchedule(after.id)
    return
  }

  const participantIds = new Set(after.participants.map((participant) => participant.userId))
  const links = await CalendarEventLink.query().where('scheduleId', after.id)

  for (const link of links) {
    if (!participantIds.has(link.userId)) {
      await removeLink(link)
    }
  }

  for (const participant of after.participants) {
    const connection = await activeConnection(participant.userId)
    if (!connection?.refreshToken) {
      continue
    }
    await upsert(connection, after)
  }
}

async function dropMembers(before: ScheduleSnap, removedMembershipIds: string[]) {
  const dropped = new Set(removedMembershipIds)
  const userIds = before.participants
    .filter((participant) => dropped.has(participant.membershipId))
    .map((participant) => participant.userId)
  if (userIds.length === 0) {
    return
  }
  const links = await CalendarEventLink.query()
    .where('scheduleId', before.id)
    .whereIn('userId', userIds)
  for (const link of links) {
    await removeLink(link)
  }
}

async function clearSchedule(scheduleId: string) {
  const links = await CalendarEventLink.query().where('scheduleId', scheduleId)
  for (const link of links) {
    await removeLink(link)
  }
}

async function upsert(connection: CalendarConnection, schedule: ScheduleSnap) {
  if (!connection.refreshToken) {
    return
  }
  const event = await eventBody(schedule)
  const gateway = getCalendarGateway()
  const link = await CalendarEventLink.query()
    .where('userId', connection.userId)
    .where('scheduleId', schedule.id)
    .first()

  if (link) {
    await gateway.updateEvent(
      connection.refreshToken,
      connection.calendarId,
      link.externalId,
      event
    )
    return
  }

  const externalId = await gateway.createEvent(
    connection.refreshToken,
    connection.calendarId,
    event
  )
  await CalendarEventLink.create({
    userId: connection.userId,
    scheduleId: schedule.id,
    externalId,
  })
}

async function removeLink(link: CalendarEventLink) {
  const connection = await CalendarConnection.findBy('userId', link.userId)
  if (connection?.refreshToken) {
    await getCalendarGateway().deleteEvent(
      connection.refreshToken,
      connection.calendarId,
      link.externalId
    )
  }
  await link.delete()
}

async function eventBody(schedule: ScheduleSnap): Promise<CalendarEventBody> {
  const ministry = await Ministry.findOrFail(schedule.ministryId)
  const start = DateTime.fromISO(schedule.startsAt, { zone: 'utc' }).setZone(ministry.timezone)
  const end = schedule.endsAt
    ? DateTime.fromISO(schedule.endsAt, { zone: 'utc' }).setZone(ministry.timezone)
    : start.plus({ hours: 1 })

  return {
    title: schedule.title,
    description: ministry.name,
    startsAt: start.toISO({ suppressMilliseconds: true })!,
    endsAt: end.toISO({ suppressMilliseconds: true })!,
    timeZone: ministry.timezone,
  }
}

async function snapOf(schedule: Schedule): Promise<ScheduleSnap> {
  return {
    id: schedule.id,
    ministryId: schedule.ministryId,
    status: schedule.status,
    title: schedule.title,
    startsAt: schedule.startsAt.toUTC().toISO()!,
    endsAt: schedule.endsAt?.toUTC().toISO() ?? null,
    notes: schedule.notes,
    participants: [],
    songs: [],
  }
}

async function activeConnection(userId: string) {
  const connection = await CalendarConnection.findBy('userId', userId)
  if (!connection || connection.disconnectedAt || !connection.refreshToken) {
    return null
  }
  return connection
}

async function guard(work: () => Promise<void>) {
  try {
    await work()
  } catch (error) {
    logger.error({ err: error }, '[agenda] falha ao sincronizar')
  }
}

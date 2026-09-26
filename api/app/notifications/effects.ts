import { DateTime } from 'luxon'
import type { NotificationType } from '#notifications/catalog'

export type ParticipantSnap = {
  membershipId: string
  userId: string
  functionIds: string[]
}

export type SongSnap = {
  songId: string
  keyOverride: string | null
}

export type ScheduleSnap = {
  id: string
  ministryId: string
  status: 'draft' | 'published'
  title: string
  startsAt: string
  endsAt: string | null
  notes: string
  participants: ParticipantSnap[]
  songs: SongSnap[]
}

export type SeriesEffect =
  | { kind: 'saved'; before: ScheduleSnap; after: ScheduleSnap }
  | { kind: 'deleted'; before: ScheduleSnap }
  | { kind: 'team_trimmed'; before: ScheduleSnap; removedMembershipIds: string[] }

export type NotificationIntent = {
  userId: string
  ministryId: string
  scheduleId: string | null
  type: NotificationType
  title: string
  body: string
  link: string
}

export function scheduleLink(ministryId: string, scheduleId: string) {
  return `/m/${ministryId}/escalas/${scheduleId}`
}

export function intentsFromEffects(effects: SeriesEffect[], zone: string) {
  return effects.flatMap((effect) => {
    if (effect.kind === 'deleted') {
      return intentsForDeleted(effect.before)
    }
    if (effect.kind === 'team_trimmed') {
      return intentsForTrim(effect.before, effect.removedMembershipIds)
    }
    return intentsForSaved(effect.before, effect.after, zone)
  })
}

function intentsForSaved(before: ScheduleSnap, after: ScheduleSnap, zone: string) {
  if (after.status !== 'published') {
    return []
  }
  if (before.status === 'draft') {
    return after.participants.map((participant) => added(after, participant.userId))
  }

  const beforeIds = new Set(before.participants.map((participant) => participant.membershipId))
  const afterIds = new Set(after.participants.map((participant) => participant.membershipId))
  const intents: NotificationIntent[] = []

  for (const participant of after.participants) {
    if (!beforeIds.has(participant.membershipId)) {
      intents.push(added(after, participant.userId))
    }
  }
  for (const participant of before.participants) {
    if (!afterIds.has(participant.membershipId)) {
      intents.push(removed(after, participant.userId))
    }
  }

  const line = changeLine(before, after, zone)
  if (!line) {
    return intents
  }
  for (const participant of after.participants) {
    if (beforeIds.has(participant.membershipId)) {
      intents.push(changed(after, participant.userId, line))
    }
  }
  return intents
}

function intentsForDeleted(before: ScheduleSnap) {
  if (before.status !== 'published') {
    return []
  }
  return before.participants.map((participant) => cancelled(before, participant.userId))
}

function intentsForTrim(before: ScheduleSnap, removedMembershipIds: string[]) {
  if (before.status !== 'published' || removedMembershipIds.length === 0) {
    return []
  }
  const dropped = new Set(removedMembershipIds)
  return before.participants.map((participant) =>
    dropped.has(participant.membershipId)
      ? removed(before, participant.userId)
      : changed(before, participant.userId, 'Equipe.')
  )
}

function added(schedule: ScheduleSnap, userId: string): NotificationIntent {
  return intent(
    schedule,
    userId,
    'schedule_added',
    'Você foi adicionado a uma escala',
    schedule.title
  )
}

function removed(schedule: ScheduleSnap, userId: string): NotificationIntent {
  return intent(
    schedule,
    userId,
    'schedule_removed',
    'Você foi removido de uma escala',
    schedule.title
  )
}

function changed(schedule: ScheduleSnap, userId: string, body: string): NotificationIntent {
  return intent(schedule, userId, 'schedule_changed', 'Escala alterada', body)
}

function cancelled(schedule: ScheduleSnap, userId: string): NotificationIntent {
  return intent(schedule, userId, 'schedule_cancelled', 'Escala cancelada', schedule.title)
}

function intent(
  schedule: ScheduleSnap,
  userId: string,
  type: NotificationType,
  title: string,
  body: string
): NotificationIntent {
  return {
    userId,
    ministryId: schedule.ministryId,
    scheduleId: schedule.id,
    type,
    title,
    body,
    link: scheduleLink(schedule.ministryId, schedule.id),
  }
}

export function scheduleChangeSummary(effect: SeriesEffect, zone: string) {
  if (effect.kind === 'deleted') {
    return 'Excluída'
  }
  if (effect.kind === 'team_trimmed') {
    return 'Equipe'
  }

  const parts: string[] = []
  if (effect.before.status !== 'published' && effect.after.status === 'published') {
    parts.push('Publicada')
  }
  if (effect.before.status === 'published' && effect.after.status === 'draft') {
    parts.push('Rascunho')
  }
  if (
    calendarChanged(effect.before, effect.after, zone) ||
    clockChanged(effect.before, effect.after, zone)
  ) {
    parts.push('Horário')
  }
  if (teamChanged(effect.before, effect.after)) {
    parts.push('Equipe')
  }
  if (songsChanged(effect.before, effect.after)) {
    parts.push('Músicas')
  }
  return parts.length === 0 ? 'Salva' : parts.join(', ')
}

function teamChanged(before: ScheduleSnap, after: ScheduleSnap) {
  const key = (snap: ScheduleSnap) =>
    snap.participants
      .map(
        (participant) =>
          `${participant.membershipId}:${[...participant.functionIds].sort().join(',')}`
      )
      .sort()
      .join('|')
  return key(before) !== key(after)
}

function changeLine(before: ScheduleSnap, after: ScheduleSnap, zone: string) {
  const parts: string[] = []
  if (calendarChanged(before, after, zone)) {
    parts.push('Data')
  }
  if (clockChanged(before, after, zone)) {
    parts.push('Horário')
  }
  if (functionsChanged(before, after)) {
    parts.push('Funções')
  }
  if (songsChanged(before, after)) {
    parts.push('Músicas')
  }
  if (before.notes !== after.notes) {
    parts.push('Observações')
  }
  return joinLine(parts)
}

function calendarChanged(before: ScheduleSnap, after: ScheduleSnap, zone: string) {
  return (
    localDate(before.startsAt, zone) !== localDate(after.startsAt, zone) ||
    localDate(before.endsAt, zone) !== localDate(after.endsAt, zone)
  )
}

function clockChanged(before: ScheduleSnap, after: ScheduleSnap, zone: string) {
  return (
    localTime(before.startsAt, zone) !== localTime(after.startsAt, zone) ||
    localTime(before.endsAt, zone) !== localTime(after.endsAt, zone)
  )
}

function functionsChanged(before: ScheduleSnap, after: ScheduleSnap) {
  const next = new Map(
    after.participants.map((participant) => [
      participant.membershipId,
      [...participant.functionIds].sort().join(','),
    ])
  )
  return before.participants.some((participant) => {
    const stayed = next.get(participant.membershipId)
    if (stayed === undefined) {
      return false
    }
    return stayed !== [...participant.functionIds].sort().join(',')
  })
}

function songsChanged(before: ScheduleSnap, after: ScheduleSnap) {
  const key = (songs: SongSnap[]) =>
    songs.map((song) => `${song.songId}:${song.keyOverride ?? ''}`).join('|')
  return key(before.songs) !== key(after.songs)
}

function localDate(iso: string | null, zone: string) {
  if (!iso) {
    return ''
  }
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).toISODate() ?? ''
}

function localTime(iso: string | null, zone: string) {
  if (!iso) {
    return ''
  }
  return DateTime.fromISO(iso, { zone: 'utc' }).setZone(zone).toFormat('HH:mm')
}

function joinLine(parts: string[]) {
  if (parts.length === 0) {
    return ''
  }
  const words = parts.map((part, index) => (index === 0 ? part : part.toLowerCase()))
  if (words.length === 1) {
    return `${words[0]}.`
  }
  const last = words.pop()
  return `${words.join(', ')} e ${last}.`
}

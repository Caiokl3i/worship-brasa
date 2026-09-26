import { SONG_KEYS } from './repertoire.ts'

export { SONG_KEYS }

export type ScheduleSummary = {
  id: string
  title: string
  startsAt: string
  endsAt: string | null
  status: 'draft' | 'published'
}

export type ScheduleLists = {
  upcoming: ScheduleSummary[]
  past: ScheduleSummary[]
}

export type ScheduleFunction = {
  id: string
  name: string
  archived: boolean
}

export type ScheduleConflict = {
  kind: 'schedule' | 'unavailability'
  title?: string
  status?: 'draft' | 'published'
}

export type ScheduleParticipant = {
  id: string
  membershipId: string
  name: string
  functions: ScheduleFunction[]
  confirmation: 'pending' | 'confirmed' | 'declined' | null
  absent: boolean | null
  conflicts: ScheduleConflict[]
}

export type ScheduleLink = {
  id: string
  kind: string
  label: string
  url: string
}

export type ScheduleHighlight = {
  membershipId: string
  functionId: string
}

export type ScheduleSong = {
  id: string
  position: number
  songId: string
  title: string
  artist: string | null
  versionId: string | null
  versionName: string | null
  keyOverride: string | null
  effectiveKey: string
  notes: string
  durationSeconds: number | null
  links: ScheduleLink[]
  highlights: ScheduleHighlight[]
}

export type ScheduleDetail = ScheduleSummary & {
  notes: string
  dressCode: string
  confirmationRequired: boolean
  version: number
  participants: ScheduleParticipant[]
  songs: ScheduleSong[]
}

export function formatInZone(iso: string | null, timeZone: string) {
  if (!iso) {
    return ''
  }

  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function toLocalInput(iso: string | null, timeZone: string) {
  if (!iso) {
    return ''
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  const hour = value('hour') === '24' ? '00' : value('hour')
  return `${value('year')}-${value('month')}-${value('day')}T${hour}:${value('minute')}`
}

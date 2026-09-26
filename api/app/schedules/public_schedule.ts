import type Schedule from '#models/schedule'
import type ScheduleChange from '#models/schedule_change'
import type Membership from '#models/membership'
import { effectiveKey } from '#schedules/effective_key'
import type { Conflict } from '#schedules/conflicts'
import { summedDuration } from '#schedules/script_layout'
import MembershipAccessService from '#services/membership_access_service'

export function toScheduleSummary(schedule: Schedule) {
  return {
    id: schedule.id,
    title: schedule.title,
    startsAt: schedule.startsAt.toUTC().toISO(),
    endsAt: schedule.endsAt?.toUTC().toISO() ?? null,
    status: schedule.status,
  }
}

export type ScheduleSeriesSummary = {
  id: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  weekdays: number[]
  detached: boolean
  upcoming: Array<{
    id: string
    title: string
    startsAt: string
    detachedFromSeries: boolean
  }>
}

export function toScheduleDetail(
  schedule: Schedule,
  actor: Membership,
  conflicts: Map<string, Conflict[]>,
  series: ScheduleSeriesSummary | null,
  changes: ScheduleChange[]
) {
  const manages = new MembershipAccessService().managesSchedules(actor)
  return {
    ...toScheduleSummary(schedule),
    notes: schedule.notes,
    dressCode: schedule.dressCode,
    confirmationRequired: schedule.confirmationRequired,
    version: schedule.version,
    series,
    script: toScript(schedule),
    participants: schedule.participants.map((participant) => ({
      id: participant.id,
      membershipId: participant.membershipId,
      name: participant.membership.user.name,
      functions: participant.assignments
        .slice()
        .sort(
          (left, right) =>
            left.function.sortOrder - right.function.sortOrder ||
            left.function.name.localeCompare(right.function.name, 'pt')
        )
        .map((assignment) => ({
          id: assignment.function.id,
          name: assignment.function.name,
          archived: assignment.function.archivedAt !== null,
        })),
      confirmation:
        manages || participant.membershipId === actor.id ? participant.confirmation : null,
      absent: manages || participant.membershipId === actor.id ? participant.absent : null,
      conflicts: conflicts.get(participant.membershipId) ?? [],
    })),
    songs: schedule.songs.map((scheduleSong) => {
      const versionKey = scheduleSong.versionId ? scheduleSong.version.key : null
      return {
        id: scheduleSong.id,
        position: scheduleSong.position,
        songId: scheduleSong.songId,
        title: scheduleSong.song.title,
        artist: scheduleSong.song.artist,
        versionId: scheduleSong.versionId,
        versionName: scheduleSong.versionId ? scheduleSong.version.name : null,
        keyOverride: scheduleSong.keyOverride,
        effectiveKey: effectiveKey({
          keyOverride: scheduleSong.keyOverride,
          versionKey,
          defaultKey: scheduleSong.song.defaultKey,
        }),
        notes: scheduleSong.notes,
        durationSeconds: scheduleSong.durationSeconds,
        links: scheduleSong.song.links
          .filter((link) => link.versionId === null || link.versionId === scheduleSong.versionId)
          .map((link) => ({
            id: link.id,
            kind: link.kind,
            label: link.label,
            url: link.url,
          })),
        highlights: scheduleSong.highlights.map((highlight) => {
          const participant = schedule.participants.find(
            (item) => item.id === highlight.participantId
          )
          return {
            membershipId: participant?.membershipId ?? null,
            functionId: highlight.functionId,
          }
        }),
      }
    }),
    changes: changes.map((change) => ({
      id: change.id,
      summary: change.summary,
      createdAt: change.createdAt.toUTC().toISO(),
      name: change.user.name,
    })),
  }
}

function toScript(schedule: Schedule) {
  const stored = schedule.$preloaded.scriptItems ? schedule.scriptItems : []
  const songRows = stored.filter((item) => item.source === 'songs')
  const pair = schedule.songs.length > 0 && songRows.length === schedule.songs.length
  let cursor = 0
  const items = stored.map((item) => {
    let key: string | null = null
    if (item.source === 'songs' && pair) {
      const song = schedule.songs[cursor]
      cursor += 1
      const versionKey = song.versionId ? song.version.key : null
      const resolved = effectiveKey({
        keyOverride: song.keyOverride,
        versionKey,
        defaultKey: song.song.defaultKey,
      })
      key = resolved || null
    }
    return {
      id: item.id,
      position: item.position,
      title: item.title,
      notes: item.notes,
      durationSeconds: item.durationSeconds,
      source: item.source === 'songs' ? ('songs' as const) : ('manual' as const),
      effectiveKey: key,
      locked: item.source === 'songs',
    }
  })

  return {
    totalDurationSeconds: summedDuration(items),
    items,
  }
}

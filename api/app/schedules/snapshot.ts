import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import ScheduleParticipant from '#models/schedule_participant'
import ScheduleSong from '#models/schedule_song'
import Schedule from '#models/schedule'
import type { ScheduleSnap } from '#notifications/effects'

export async function snapshotSchedule(
  scheduleId: string,
  trx: TransactionClientContract
): Promise<ScheduleSnap> {
  const schedule = await Schedule.query({ client: trx }).where('id', scheduleId).firstOrFail()
  const participants = await ScheduleParticipant.query({ client: trx })
    .where('scheduleId', scheduleId)
    .preload('assignments')
    .preload('membership')
  const songs = await ScheduleSong.query({ client: trx })
    .where('scheduleId', scheduleId)
    .orderBy('position', 'asc')

  return {
    id: schedule.id,
    ministryId: schedule.ministryId,
    status: schedule.status,
    title: schedule.title,
    startsAt: schedule.startsAt.toUTC().toISO()!,
    endsAt: schedule.endsAt?.toUTC().toISO() ?? null,
    notes: schedule.notes,
    participants: participants.map((participant) => ({
      membershipId: participant.membershipId,
      userId: participant.membership.userId,
      functionIds: participant.assignments.map((assignment) => assignment.functionId).sort(),
    })),
    songs: songs.map((song) => ({
      songId: song.songId,
      keyOverride: song.keyOverride,
    })),
  }
}

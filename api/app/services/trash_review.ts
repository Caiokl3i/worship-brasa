import Schedule from '#models/schedule'
import Song from '#models/song'
import { trashSince } from '#constants/trash'

export async function countExpiredTrash() {
  const since = trashSince().toSQL()!
  const schedules = await Schedule.query().whereNotNull('deletedAt').where('deletedAt', '<', since)
  const songs = await Song.query().whereNotNull('deletedAt').where('deletedAt', '<', since)
  return { schedules: schedules.length, songs: songs.length }
}

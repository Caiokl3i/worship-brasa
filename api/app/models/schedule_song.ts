import { randomUUID } from 'node:crypto'
import { ScheduleSongSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Schedule from '#models/schedule'
import Song from '#models/song'
import SongVersion from '#models/song_version'
import ScheduleSongHighlight from '#models/schedule_song_highlight'

export default class ScheduleSong extends ScheduleSongSchema {
  @beforeCreate()
  static assignId(scheduleSong: ScheduleSong) {
    scheduleSong.id = randomUUID()
  }

  @belongsTo(() => Schedule)
  declare schedule: BelongsTo<typeof Schedule>

  @belongsTo(() => Song)
  declare song: BelongsTo<typeof Song>

  @belongsTo(() => SongVersion, { foreignKey: 'versionId' })
  declare version: BelongsTo<typeof SongVersion>

  @hasMany(() => ScheduleSongHighlight)
  declare highlights: HasMany<typeof ScheduleSongHighlight>
}

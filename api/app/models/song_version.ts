import { randomUUID } from 'node:crypto'
import { SongVersionSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Song from '#models/song'
import SongLink from '#models/song_link'

export default class SongVersion extends SongVersionSchema {
  @beforeCreate()
  static assignId(version: SongVersion) {
    version.id = randomUUID()
  }

  @belongsTo(() => Song)
  declare song: BelongsTo<typeof Song>

  @hasMany(() => SongLink, { foreignKey: 'versionId' })
  declare links: HasMany<typeof SongLink>
}

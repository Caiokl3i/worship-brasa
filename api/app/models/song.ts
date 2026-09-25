import { randomUUID } from 'node:crypto'
import { SongSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Ministry from '#models/ministry'
import Classification from '#models/classification'
import Folder from '#models/folder'
import SongVersion from '#models/song_version'
import SongLink from '#models/song_link'

export default class Song extends SongSchema {
  @beforeCreate()
  static assignId(song: Song) {
    song.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>

  @belongsTo(() => Classification)
  declare classification: BelongsTo<typeof Classification>

  @belongsTo(() => Folder)
  declare folder: BelongsTo<typeof Folder>

  @hasMany(() => SongVersion)
  declare versions: HasMany<typeof SongVersion>

  @hasMany(() => SongLink)
  declare links: HasMany<typeof SongLink>
}

import { randomUUID } from 'node:crypto'
import { SongLinkSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Song from '#models/song'
import SongVersion from '#models/song_version'

export type SongLinkKind = 'cifra' | 'letra' | 'video' | 'audio' | 'custom'

export default class SongLink extends SongLinkSchema {
  @beforeCreate()
  static assignId(link: SongLink) {
    link.id = randomUUID()
  }

  @belongsTo(() => Song)
  declare song: BelongsTo<typeof Song>

  @belongsTo(() => SongVersion, { foreignKey: 'versionId' })
  declare version: BelongsTo<typeof SongVersion>
}

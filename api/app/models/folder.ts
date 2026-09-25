import { randomUUID } from 'node:crypto'
import { FolderSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Ministry from '#models/ministry'

export default class Folder extends FolderSchema {
  @beforeCreate()
  static assignId(folder: Folder) {
    folder.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>
}

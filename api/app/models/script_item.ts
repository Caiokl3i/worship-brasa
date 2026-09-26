import { randomUUID } from 'node:crypto'
import { ScriptItemSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Schedule from '#models/schedule'

export default class ScriptItem extends ScriptItemSchema {
  @beforeCreate()
  static assignId(item: ScriptItem) {
    item.id = randomUUID()
  }

  @belongsTo(() => Schedule)
  declare schedule: BelongsTo<typeof Schedule>
}

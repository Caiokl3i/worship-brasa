import { randomUUID } from 'node:crypto'
import { SeriesScriptItemSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Series from '#models/series'

export default class SeriesScriptItem extends SeriesScriptItemSchema {
  @beforeCreate()
  static assignId(item: SeriesScriptItem) {
    item.id = randomUUID()
  }

  @belongsTo(() => Series)
  declare series: BelongsTo<typeof Series>
}

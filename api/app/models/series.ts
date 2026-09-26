import { randomUUID } from 'node:crypto'
import { SeriesSchema } from '#database/schema'
import Ministry from '#models/ministry'
import { belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class Series extends SeriesSchema {
  @beforeCreate()
  static assignId(series: Series) {
    series.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>
}

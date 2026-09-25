import { randomUUID } from 'node:crypto'
import { ClassificationSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Ministry from '#models/ministry'

export default class Classification extends ClassificationSchema {
  @beforeCreate()
  static assignId(classification: Classification) {
    classification.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>
}

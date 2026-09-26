import { randomUUID } from 'node:crypto'
import { MinistryGenerationDefaultSchema } from '#database/schema'
import Ministry from '#models/ministry'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class MinistryGenerationDefault extends MinistryGenerationDefaultSchema {
  @beforeCreate()
  static assignId(row: MinistryGenerationDefault) {
    row.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>
}

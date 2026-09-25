import { randomUUID } from 'node:crypto'
import { MinistryFunctionSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Ministry from '#models/ministry'

export default class MinistryFunction extends MinistryFunctionSchema {
  @beforeCreate()
  static assignId(ministryFunction: MinistryFunction) {
    ministryFunction.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>
}

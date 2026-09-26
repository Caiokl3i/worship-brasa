import { randomUUID } from 'node:crypto'
import { ScheduleChangeSchema } from '#database/schema'
import Schedule from '#models/schedule'
import User from '#models/user'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class ScheduleChange extends ScheduleChangeSchema {
  @beforeCreate()
  static assignId(change: ScheduleChange) {
    change.id = randomUUID()
  }

  @belongsTo(() => Schedule)
  declare schedule: BelongsTo<typeof Schedule>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

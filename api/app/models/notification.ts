import { randomUUID } from 'node:crypto'
import { NotificationSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Ministry from '#models/ministry'
import Schedule from '#models/schedule'
import User from '#models/user'

export default class Notification extends NotificationSchema {
  @beforeCreate()
  static assignId(notification: Notification) {
    notification.id = randomUUID()
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>

  @belongsTo(() => Schedule)
  declare schedule: BelongsTo<typeof Schedule>
}

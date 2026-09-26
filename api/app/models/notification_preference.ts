import { randomUUID } from 'node:crypto'
import { NotificationPreferenceSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class NotificationPreference extends NotificationPreferenceSchema {
  @beforeCreate()
  static assignId(preference: NotificationPreference) {
    preference.id = randomUUID()
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

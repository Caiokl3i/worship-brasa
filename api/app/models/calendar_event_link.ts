import { randomUUID } from 'node:crypto'
import { CalendarEventLinkSchema } from '#database/schema'
import Schedule from '#models/schedule'
import User from '#models/user'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class CalendarEventLink extends CalendarEventLinkSchema {
  @beforeCreate()
  static assignId(link: CalendarEventLink) {
    link.id = randomUUID()
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Schedule)
  declare schedule: BelongsTo<typeof Schedule>
}

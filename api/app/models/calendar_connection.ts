import { randomUUID } from 'node:crypto'
import { CalendarConnectionSchema } from '#database/schema'
import User from '#models/user'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class CalendarConnection extends CalendarConnectionSchema {
  @beforeCreate()
  static assignId(connection: CalendarConnection) {
    connection.id = randomUUID()
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

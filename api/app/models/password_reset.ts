import { randomUUID } from 'node:crypto'
import { PasswordResetSchema } from '#database/schema'
import User from '#models/user'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class PasswordReset extends PasswordResetSchema {
  @beforeCreate()
  static assignId(reset: PasswordReset) {
    reset.id = randomUUID()
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

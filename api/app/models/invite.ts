import { randomUUID } from 'node:crypto'
import { InviteSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Ministry from '#models/ministry'
import User from '#models/user'

export default class Invite extends InviteSchema {
  @beforeCreate()
  static assignId(invite: Invite) {
    invite.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare creator: BelongsTo<typeof User>
}

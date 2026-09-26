import { randomUUID } from 'node:crypto'
import { EmailInviteSchema } from '#database/schema'
import Ministry from '#models/ministry'
import User from '#models/user'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class EmailInvite extends EmailInviteSchema {
  @beforeCreate()
  static assignId(invite: EmailInvite) {
    invite.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>

  @belongsTo(() => User, { foreignKey: 'createdByUserId' })
  declare creator: BelongsTo<typeof User>
}

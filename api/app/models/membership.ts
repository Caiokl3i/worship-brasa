import { randomUUID } from 'node:crypto'
import { MembershipSchema } from '#database/schema'
import { beforeCreate, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Ministry from '#models/ministry'
import MinistryFunction from '#models/ministry_function'

export type MembershipStatus = 'pending' | 'active' | 'left'

export default class Membership extends MembershipSchema {
  @beforeCreate()
  static assignId(membership: Membership) {
    membership.id = randomUUID()
  }

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>

  @manyToMany(() => MinistryFunction, {
    pivotTable: 'member_functions',
    pivotForeignKey: 'membership_id',
    pivotRelatedForeignKey: 'function_id',
  })
  declare functions: ManyToMany<typeof MinistryFunction>
}

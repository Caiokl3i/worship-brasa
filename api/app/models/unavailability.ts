import { randomUUID } from 'node:crypto'
import { UnavailabilitySchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Membership from '#models/membership'

export default class Unavailability extends UnavailabilitySchema {
  @beforeCreate()
  static assignId(unavailability: Unavailability) {
    unavailability.id = randomUUID()
  }

  @belongsTo(() => Membership)
  declare membership: BelongsTo<typeof Membership>
}

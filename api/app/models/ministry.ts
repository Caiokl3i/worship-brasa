import { randomUUID } from 'node:crypto'
import { MinistrySchema } from '#database/schema'
import { beforeCreate } from '@adonisjs/lucid/orm'

export default class Ministry extends MinistrySchema {
  @beforeCreate()
  static assignId(ministry: Ministry) {
    ministry.id = randomUUID()
  }
}

import { randomUUID } from 'node:crypto'
import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { beforeCreate, beforeSave } from '@adonisjs/lucid/orm'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  @beforeCreate()
  static assignId(user: User) {
    user.id = randomUUID()
  }

  @beforeSave()
  static normalizeEmail(user: User) {
    if (user.email) {
      user.email = user.email.trim().toLowerCase()
    }
  }
}

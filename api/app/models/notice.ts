import { randomUUID } from 'node:crypto'
import { NoticeSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Membership from '#models/membership'
import Ministry from '#models/ministry'

export default class Notice extends NoticeSchema {
  @beforeCreate()
  static assignId(notice: Notice) {
    notice.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>

  @belongsTo(() => Membership)
  declare membership: BelongsTo<typeof Membership>
}

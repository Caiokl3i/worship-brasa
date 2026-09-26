import { randomUUID } from 'node:crypto'
import { ChatThreadSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import ChatMessage from '#models/chat_message'
import Ministry from '#models/ministry'
import Schedule from '#models/schedule'

export default class ChatThread extends ChatThreadSchema {
  @beforeCreate()
  static assignId(thread: ChatThread) {
    thread.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>

  @belongsTo(() => Schedule)
  declare schedule: BelongsTo<typeof Schedule>

  @hasMany(() => ChatMessage, { foreignKey: 'threadId' })
  declare messages: HasMany<typeof ChatMessage>
}

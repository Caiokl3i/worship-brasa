import { randomUUID } from 'node:crypto'
import { ChatMessageSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ChatThread from '#models/chat_thread'
import Membership from '#models/membership'

export default class ChatMessage extends ChatMessageSchema {
  @beforeCreate()
  static assignId(message: ChatMessage) {
    message.id = randomUUID()
  }

  @belongsTo(() => ChatThread, { foreignKey: 'threadId' })
  declare thread: BelongsTo<typeof ChatThread>

  @belongsTo(() => Membership)
  declare membership: BelongsTo<typeof Membership>
}

import { randomUUID } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import type Membership from '#models/membership'
import ChatMessage from '#models/chat_message'
import ChatThread from '#models/chat_thread'
import Schedule from '#models/schedule'
import { ScheduleNotFoundException } from '#exceptions/ministry_exceptions'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import NotificationService from '#services/notification_service'

const PAGE_SIZE = 50

async function withAuthor(message: ChatMessage) {
  await message.load('membership', (query) => query.preload('user'))
  return message
}

export default class ChatService {
  async ministryPage(actor: Membership, before?: string) {
    const thread = await ChatThread.query()
      .where('ministryId', actor.ministryId)
      .whereNull('scheduleId')
      .first()
    return this.#page(thread, before)
  }

  async sendToMinistry(actor: Membership, body: string) {
    const thread = await this.#ministryThread(actor.ministryId)
    const message = await this.#send(thread, actor, body)
    await new NotificationService().notifyMinistryChat(actor, body)
    return message
  }

  async schedulePage(actor: Membership, scheduleId: string, before?: string) {
    const schedule = await this.#visibleSchedule(actor, scheduleId)
    const thread = await ChatThread.query().where('scheduleId', schedule.id).first()
    return this.#page(thread, before)
  }

  async sendToSchedule(actor: Membership, scheduleId: string, body: string) {
    const schedule = await this.#visibleSchedule(actor, scheduleId)
    const thread = await this.#scheduleThread(schedule)
    const message = await this.#send(thread, actor, body)
    await new NotificationService().notifyScheduleChat(actor, schedule, body)
    return message
  }

  async #page(thread: ChatThread | null, before?: string) {
    if (!thread) {
      return { messages: [], hasMore: false }
    }

    const cursor = await this.#cursor(thread.id, before)
    const query = ChatMessage.query()
      .where('threadId', thread.id)
      .preload('membership', (membership) => membership.preload('user'))
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .limit(PAGE_SIZE + 1)

    if (cursor) {
      query.where((builder) => {
        builder.where('createdAt', '<', cursor.createdAt.toSQL()!).orWhere((tie) => {
          tie.where('createdAt', cursor.createdAt.toSQL()!).where('id', '<', cursor.id)
        })
      })
    }

    const rows = await query
    const hasMore = rows.length > PAGE_SIZE
    return { messages: rows.slice(0, PAGE_SIZE).reverse(), hasMore }
  }

  async #cursor(threadId: string, before?: string) {
    if (!before || !isUuid(before)) {
      return null
    }
    return ChatMessage.query().where('id', before).where('threadId', threadId).first()
  }

  async #send(thread: ChatThread, actor: Membership, body: string) {
    const message = await ChatMessage.create({
      threadId: thread.id,
      membershipId: actor.id,
      body,
    })
    return withAuthor(message)
  }

  async #ministryThread(ministryId: string) {
    const existing = await ChatThread.query()
      .where('ministryId', ministryId)
      .whereNull('scheduleId')
      .first()
    if (existing) {
      return existing
    }

    await db.rawQuery(
      `insert into chat_threads (id, ministry_id, schedule_id, created_at)
       values (?, ?, null, now())
       on conflict (ministry_id) where schedule_id is null do nothing`,
      [randomUUID(), ministryId]
    )
    return ChatThread.query().where('ministryId', ministryId).whereNull('scheduleId').firstOrFail()
  }

  async #scheduleThread(schedule: Schedule) {
    const existing = await ChatThread.query().where('scheduleId', schedule.id).first()
    if (existing) {
      return existing
    }

    await db.rawQuery(
      `insert into chat_threads (id, ministry_id, schedule_id, created_at)
       values (?, ?, ?, now())
       on conflict (schedule_id) where schedule_id is not null do nothing`,
      [randomUUID(), schedule.ministryId, schedule.id]
    )
    return ChatThread.query().where('scheduleId', schedule.id).firstOrFail()
  }

  async #visibleSchedule(actor: Membership, scheduleId: string) {
    if (!isUuid(scheduleId)) {
      throw new ScheduleNotFoundException()
    }

    const schedule = await Schedule.query()
      .where('id', scheduleId)
      .where('ministryId', actor.ministryId)
      .whereNull('deletedAt')
      .first()
    if (!schedule) {
      throw new ScheduleNotFoundException()
    }
    if (schedule.status === 'draft' && !new MembershipAccessService().managesSchedules(actor)) {
      throw new ScheduleNotFoundException()
    }
    return schedule
  }
}

import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'
import Membership from '#models/membership'
import Notification from '#models/notification'
import NotificationPreference from '#models/notification_preference'
import Schedule from '#models/schedule'
import User from '#models/user'
import { NotificationNotFoundException } from '#exceptions/ministry_exceptions'
import {
  NOTIFICATION_DEFAULTS,
  NOTIFICATION_TYPES,
  REMINDER_BODIES,
  isReminder,
  type NotificationType,
} from '#notifications/catalog'
import { scheduleLink, type NotificationIntent } from '#notifications/effects'
import { isUuid } from '#services/membership_access_service'
import { getNotificationMailer } from '#services/notification_mailer'

const PAGE_SIZE = 50

type PreferenceInput = {
  type: NotificationType
  inApp: boolean
  email: boolean
}

type Audience = {
  ministryId: string
  exceptUserId?: string
  onlyManagers?: boolean
  onlyAdmins?: boolean
  type: NotificationType
  title: string
  body: string
  link: string
  scheduleId?: string | null
}

export default class NotificationService {
  async list(userId: string) {
    const notifications = await Notification.query()
      .where('userId', userId)
      .orderBy('createdAt', 'desc')
      .orderBy('id', 'desc')
      .limit(PAGE_SIZE)
    const unread = await db.rawQuery(
      'select count(*)::int as total from notifications where user_id = ? and read_at is null',
      [userId]
    )
    return {
      unreadCount: Number(unread.rows[0]?.total ?? 0),
      notifications,
    }
  }

  async markRead(userId: string, notificationId: string) {
    if (!isUuid(notificationId)) {
      throw new NotificationNotFoundException()
    }
    const notification = await Notification.query()
      .where('id', notificationId)
      .where('userId', userId)
      .first()
    if (!notification) {
      throw new NotificationNotFoundException()
    }
    if (!notification.readAt) {
      notification.readAt = DateTime.utc()
      await notification.save()
    }
    return notification
  }

  async preferences(userId: string) {
    const rows = await NotificationPreference.query().where('userId', userId)
    const saved = new Map(rows.map((row) => [row.type, row]))
    return NOTIFICATION_TYPES.map((type) => {
      const defaults = NOTIFICATION_DEFAULTS[type]
      const row = saved.get(type)
      return {
        type,
        label: defaults.label,
        group: defaults.group,
        inApp: row?.inApp ?? defaults.inApp,
        email: row?.email ?? defaults.email,
      }
    })
  }

  async savePreferences(userId: string, items: PreferenceInput[]) {
    for (const item of items) {
      const existing = await NotificationPreference.query()
        .where('userId', userId)
        .where('type', item.type)
        .first()
      if (existing) {
        existing.inApp = item.inApp
        existing.email = item.email
        await existing.save()
        continue
      }
      await NotificationPreference.create({
        userId,
        type: item.type,
        inApp: item.inApp,
        email: item.email,
      })
    }
    return this.preferences(userId)
  }

  async deliver(intents: NotificationIntent[]) {
    let created = 0
    for (const intent of intents) {
      if (await this.#deliverOne(intent)) {
        created += 1
      }
    }
    return created
  }

  async notifyMinistryChat(actor: Membership, body: string) {
    await this.#notifyAudience({
      ministryId: actor.ministryId,
      exceptUserId: actor.userId,
      type: 'chat_ministry',
      title: 'Nova mensagem no chat',
      body,
      link: `/m/${actor.ministryId}/chat`,
    })
  }

  async notifyScheduleChat(actor: Membership, schedule: Schedule, body: string) {
    await this.#notifyAudience({
      ministryId: schedule.ministryId,
      exceptUserId: actor.userId,
      onlyManagers: schedule.status === 'draft',
      type: 'chat_schedule',
      title: 'Nova mensagem no chat da escala',
      body,
      link: scheduleLink(schedule.ministryId, schedule.id),
      scheduleId: schedule.id,
    })
  }

  async notifyNotice(actor: Membership, title: string, body: string) {
    await this.#notifyAudience({
      ministryId: actor.ministryId,
      exceptUserId: actor.userId,
      type: 'notice',
      title,
      body,
      link: `/m/${actor.ministryId}/avisos`,
    })
  }

  async notifyJoinRequested(ministryId: string, requesterName: string) {
    await this.#notifyAudience({
      ministryId,
      onlyAdmins: true,
      type: 'join_requested',
      title: 'Pedido de entrada',
      body: `${requesterName} pediu para entrar.`,
      link: `/m/${ministryId}/membros`,
    })
  }

  async notifyJoinDecided(userId: string, ministryId: string, approved: boolean) {
    await this.deliver([
      {
        userId,
        ministryId,
        scheduleId: null,
        type: approved ? 'join_approved' : 'join_rejected',
        title: approved ? 'Entrada aprovada' : 'Entrada rejeitada',
        body: approved
          ? 'Sua entrada no ministério foi aprovada.'
          : 'Sua entrada no ministério foi rejeitada.',
        link: approved ? `/m/${ministryId}` : '/ministerios',
      },
    ])
  }

  async #notifyAudience(input: Audience) {
    const query = Membership.query()
      .where('ministryId', input.ministryId)
      .where('status', 'active')
      .preload('user')
    if (input.onlyAdmins) {
      query.where('isAdmin', true)
    }
    const members = await query
    const intents: NotificationIntent[] = []
    for (const member of members) {
      if (member.userId === input.exceptUserId) {
        continue
      }
      if (input.onlyManagers && !member.isAdmin && !member.canManageSchedules) {
        continue
      }
      intents.push({
        userId: member.userId,
        ministryId: input.ministryId,
        scheduleId: input.scheduleId ?? null,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
      })
    }
    await this.deliver(intents)
  }

  async #deliverOne(intent: NotificationIntent) {
    const preference = await this.#preference(intent.userId, intent.type)
    if (!preference.inApp && !preference.email) {
      return false
    }

    const user = await User.find(intent.userId)
    if (!user) {
      return false
    }

    let stored = false
    if (isReminder(intent.type)) {
      stored = await this.#insertReminder(intent)
      if (!stored) {
        return false
      }
    } else if (preference.inApp) {
      await Notification.create({
        userId: intent.userId,
        ministryId: intent.ministryId,
        scheduleId: intent.scheduleId,
        type: intent.type,
        title: intent.title,
        body: intent.body,
        link: intent.link,
      })
      stored = true
    }

    if (preference.email) {
      try {
        await getNotificationMailer().send({
          email: user.email,
          title: intent.title,
          body: intent.body,
        })
      } catch (error) {
        logger.error({ err: error }, 'Falha ao enviar o e-mail da notificação')
      }
    }

    return stored || preference.email
  }

  async #preference(userId: string, type: NotificationType) {
    const saved = await NotificationPreference.query()
      .where('userId', userId)
      .where('type', type)
      .first()
    if (!saved) {
      return NOTIFICATION_DEFAULTS[type]
    }
    return { inApp: saved.inApp, email: saved.email }
  }

  async #insertReminder(intent: NotificationIntent) {
    const inserted = await db.rawQuery(
      `insert into notifications (id, user_id, ministry_id, schedule_id, type, title, body, link, created_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, now())
       on conflict (user_id, schedule_id, type)
       where schedule_id is not null
         and type in ('reminder_5d', 'reminder_1d', 'reminder_2h')
       do nothing
       returning id`,
      [
        randomUUID(),
        intent.userId,
        intent.ministryId,
        intent.scheduleId,
        intent.type,
        intent.title,
        intent.body,
        intent.link,
      ]
    )
    return inserted.rows.length > 0
  }
}

export async function sendDueReminders(now = DateTime.utc()) {
  const until = now.toUTC().plus({ days: 5 })
  const schedules = await Schedule.query()
    .where('status', 'published')
    .whereNull('deletedAt')
    .where('startsAt', '>', now.toUTC().toSQL()!)
    .where('startsAt', '<=', until.toSQL()!)
    .preload('participants', (participants) => {
      participants.preload('membership')
    })

  const intents: NotificationIntent[] = []
  for (const schedule of schedules) {
    const type = dueReminder(schedule.startsAt, now)
    if (!type) {
      continue
    }
    for (const participant of schedule.participants) {
      if (participant.confirmation === 'declined') {
        continue
      }
      if (participant.membership.status !== 'active') {
        continue
      }
      intents.push({
        userId: participant.membership.userId,
        ministryId: schedule.ministryId,
        scheduleId: schedule.id,
        type,
        title: schedule.title,
        body: REMINDER_BODIES[type],
        link: scheduleLink(schedule.ministryId, schedule.id),
      })
    }
  }

  return new NotificationService().deliver(intents)
}

function dueReminder(startsAt: DateTime, now: DateTime) {
  const current = now.toUTC().toMillis()
  const start = startsAt.toUTC().toMillis()
  if (current >= start) {
    return null
  }
  const twoHours = startsAt.toUTC().minus({ hours: 2 }).toMillis()
  const oneDay = startsAt.toUTC().minus({ days: 1 }).toMillis()
  const fiveDays = startsAt.toUTC().minus({ days: 5 }).toMillis()
  if (current >= twoHours) {
    return 'reminder_2h' as const
  }
  if (current >= oneDay) {
    return 'reminder_1d' as const
  }
  if (current >= fiveDays) {
    return 'reminder_5d' as const
  }
  return null
}

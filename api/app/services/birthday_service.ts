import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Membership from '#models/membership'
import Ministry from '#models/ministry'
import NotificationService from '#services/notification_service'

export async function listTodayBirthdays(ministry: Ministry, now = DateTime.utc()) {
  const local = now.setZone(ministry.timezone)
  const members = await Membership.query()
    .where('ministryId', ministry.id)
    .where('status', 'active')
    .preload('user')

  return members
    .filter((member) => {
      const birth = member.user.birthDate
      return birth !== null && birth.month === local.month && birth.day === local.day
    })
    .map((member) => member.user.name)
    .sort((left, right) => left.localeCompare(right, 'pt'))
}

export async function notifyBirthdays(now = DateTime.utc()) {
  const ministries = await Ministry.all()
  let created = 0

  for (const ministry of ministries) {
    const names = await listTodayBirthdays(ministry, now)
    if (names.length === 0) {
      continue
    }

    const localDate = now.setZone(ministry.timezone).toISODate()!
    const members = await Membership.query()
      .where('ministryId', ministry.id)
      .where('status', 'active')
    const body = names.join(', ')

    for (const member of members) {
      const inserted = await db.rawQuery(
        `insert into birthday_digests (id, user_id, ministry_id, local_date, created_at)
         values (?, ?, ?, ?, now())
         on conflict (user_id, ministry_id, local_date) do nothing
         returning id`,
        [randomUUID(), member.userId, ministry.id, localDate]
      )
      if (inserted.rows.length === 0) {
        continue
      }

      created += await new NotificationService().deliver([
        {
          userId: member.userId,
          ministryId: ministry.id,
          scheduleId: null,
          type: 'birthday',
          title: 'Aniversariantes do dia',
          body,
          link: `/m/${ministry.id}`,
        },
      ])
    }
  }

  return created
}

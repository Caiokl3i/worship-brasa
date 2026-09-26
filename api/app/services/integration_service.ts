import { randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import {
  InvalidIntegrationTokenException,
  ScheduleNotFoundException,
} from '#exceptions/ministry_exceptions'
import IntegrationToken from '#models/integration_token'
import type Membership from '#models/membership'
import Ministry from '#models/ministry'
import Schedule from '#models/schedule'
import { effectiveKey } from '#schedules/effective_key'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'

export default class IntegrationService {
  async create(actor: Membership) {
    new MembershipAccessService().assertAdmin(actor)
    const plain = randomBytes(24).toString('hex')

    await db.transaction(async (trx) => {
      await IntegrationToken.query({ client: trx })
        .where('ministryId', actor.ministryId)
        .whereNull('revokedAt')
        .update({ revokedAt: DateTime.utc() })

      await IntegrationToken.create(
        {
          ministryId: actor.ministryId,
          tokenHash: await hash.make(plain),
          tokenPrefix: plain.slice(0, 8),
          createdByUserId: actor.userId,
        },
        { client: trx }
      )
    })

    return { token: plain, prefix: plain.slice(0, 8) }
  }

  async current(actor: Membership) {
    new MembershipAccessService().assertAdmin(actor)
    const token = await IntegrationToken.query()
      .where('ministryId', actor.ministryId)
      .orderBy('createdAt', 'desc')
      .first()

    if (!token) {
      return null
    }

    return {
      prefix: token.tokenPrefix,
      createdAt: token.createdAt.toISO(),
      revokedAt: token.revokedAt?.toISO() ?? null,
      lastUsedAt: token.lastUsedAt?.toISO() ?? null,
    }
  }

  async revoke(actor: Membership) {
    new MembershipAccessService().assertAdmin(actor)
    const token = await IntegrationToken.query()
      .where('ministryId', actor.ministryId)
      .whereNull('revokedAt')
      .first()
    if (!token) {
      return
    }
    token.revokedAt = DateTime.utc()
    await token.save()
  }

  async show(header: string | undefined, scheduleId: string) {
    const ministryId = await this.#ministryId(header)
    const schedule = await this.#published(ministryId, scheduleId)
    return this.#present(schedule)
  }

  async list(header: string | undefined, from: string, to: string) {
    const ministryId = await this.#ministryId(header)
    const ministry = await Ministry.findOrFail(ministryId)
    const start = DateTime.fromISO(from, { zone: ministry.timezone }).startOf('day').toUTC()
    const end = DateTime.fromISO(to, { zone: ministry.timezone }).endOf('day').toUTC()
    const schedules = await Schedule.query()
      .where('ministryId', ministryId)
      .where('status', 'published')
      .whereNull('deletedAt')
      .where('startsAt', '>=', start.toSQL()!)
      .where('startsAt', '<=', end.toSQL()!)
      .orderBy('startsAt', 'asc')
      .preload('ministry')
      .preload('participants', (participants) => {
        participants.preload('membership', (membership) => membership.preload('user'))
        participants.preload('assignments', (assignments) => assignments.preload('function'))
      })
      .preload('songs', (songs) => {
        songs.orderBy('position', 'asc').preload('song').preload('version')
      })

    return { schedules: await Promise.all(schedules.map((schedule) => this.#present(schedule))) }
  }

  async #ministryId(header: string | undefined) {
    const plain = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : ''
    if (plain.length < 8) {
      throw new InvalidIntegrationTokenException()
    }

    const rows = await IntegrationToken.query()
      .where('tokenPrefix', plain.slice(0, 8))
      .whereNull('revokedAt')

    for (const row of rows) {
      if (await hash.verify(row.tokenHash, plain)) {
        row.lastUsedAt = DateTime.utc()
        await row.save()
        return row.ministryId
      }
    }

    throw new InvalidIntegrationTokenException()
  }

  async #published(ministryId: string, scheduleId: string) {
    if (!isUuid(scheduleId)) {
      throw new ScheduleNotFoundException()
    }

    const schedule = await Schedule.query()
      .where('id', scheduleId)
      .where('ministryId', ministryId)
      .where('status', 'published')
      .whereNull('deletedAt')
      .preload('ministry')
      .preload('participants', (participants) => {
        participants.preload('membership', (membership) => membership.preload('user'))
        participants.preload('assignments', (assignments) => assignments.preload('function'))
      })
      .preload('songs', (songs) => {
        songs.orderBy('position', 'asc').preload('song').preload('version')
      })
      .first()

    if (!schedule) {
      throw new ScheduleNotFoundException()
    }
    return schedule
  }

  async #present(schedule: Schedule) {
    const zone = schedule.ministry.timezone
    return {
      id: schedule.id,
      title: schedule.title,
      startsAt: schedule.startsAt.setZone(zone).toISO({ suppressMilliseconds: true }),
      endsAt: schedule.endsAt?.setZone(zone).toISO({ suppressMilliseconds: true }) ?? null,
      songs: schedule.songs.map((scheduleSong) => ({
        title: scheduleSong.song.title,
        key: effectiveKey({
          keyOverride: scheduleSong.keyOverride,
          versionKey: scheduleSong.versionId ? scheduleSong.version.key : null,
          defaultKey: scheduleSong.song.defaultKey,
        }),
      })),
      team: schedule.participants
        .map((participant) => ({
          name: participant.membership.user.name,
          functions: participant.assignments
            .map((assignment) => assignment.function)
            .sort(
              (left, right) =>
                left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, 'pt')
            )
            .map((item) => item.name),
        }))
        .sort((left, right) => left.name.localeCompare(right.name, 'pt')),
    }
  }
}

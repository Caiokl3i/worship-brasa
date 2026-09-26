import { DateTime } from 'luxon'
import type Membership from '#models/membership'
import Ministry from '#models/ministry'
import Notice from '#models/notice'
import { NoticeNotFoundException } from '#exceptions/ministry_exceptions'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'

type NoticeInput = {
  title: string
  body: string
  pinned: boolean
  expiresAt?: DateTime | null
}

function expiryDate(expiresAt: DateTime | null) {
  return expiresAt?.toISODate() ?? null
}

export function noticeHasExpired(expiresAt: DateTime | null, zone: string, now = DateTime.utc()) {
  const expiry = expiryDate(expiresAt)
  if (!expiry) {
    return false
  }
  const today = now.setZone(zone).toISODate()
  return today !== null && today > expiry
}

function isCurrent(notice: Notice, zone: string, now: DateTime) {
  return notice.archivedAt === null && !noticeHasExpired(notice.expiresAt, zone, now)
}

async function withAuthor(notice: Notice) {
  await notice.load('membership', (query) => query.preload('user'))
  return notice
}

export async function archiveExpiredNotices(now = DateTime.utc()) {
  const notices = await Notice.query()
    .whereNull('archivedAt')
    .whereNotNull('expiresAt')
    .preload('ministry')

  let count = 0
  for (const notice of notices) {
    if (!noticeHasExpired(notice.expiresAt, notice.ministry.timezone, now)) {
      continue
    }
    notice.archivedAt = now
    await notice.save()
    count += 1
  }
  return count
}

export default class NoticeService {
  async list(actor: Membership, now = DateTime.utc()) {
    const zone = await this.#zone(actor.ministryId)
    const rows = await Notice.query()
      .where('ministryId', actor.ministryId)
      .preload('membership', (query) => query.preload('user'))
      .orderBy('createdAt', 'desc')

    const notices = rows.filter((notice) => isCurrent(notice, zone, now))
    const pinned = notices.filter((notice) => notice.pinned).slice(0, 3)
    const manages = new MembershipAccessService().managesSchedules(actor)
    const archived = manages ? rows.filter((notice) => !isCurrent(notice, zone, now)) : []

    return { notices, pinned, archived }
  }

  async create(actor: Membership, input: NoticeInput) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    const notice = await Notice.create({
      ministryId: actor.ministryId,
      membershipId: actor.id,
      title: input.title,
      body: input.body,
      pinned: input.pinned,
      expiresAt: input.expiresAt ?? null,
    })
    return withAuthor(notice)
  }

  async update(actor: Membership, noticeId: string, input: NoticeInput) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    const notice = await this.#find(actor.ministryId, noticeId)
    notice.title = input.title
    notice.body = input.body
    notice.pinned = input.pinned
    notice.expiresAt = input.expiresAt ?? null
    await notice.save()
    return withAuthor(notice)
  }

  async archive(actor: Membership, noticeId: string) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    const notice = await this.#find(actor.ministryId, noticeId)
    if (!notice.archivedAt) {
      notice.archivedAt = DateTime.utc()
      await notice.save()
    }
    return withAuthor(notice)
  }

  async unarchive(actor: Membership, noticeId: string) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    const notice = await this.#find(actor.ministryId, noticeId)
    notice.archivedAt = null
    await notice.save()
    return withAuthor(notice)
  }

  async #zone(ministryId: string) {
    const ministry = await Ministry.findOrFail(ministryId)
    return ministry.timezone
  }

  async #find(ministryId: string, noticeId: string) {
    if (!isUuid(noticeId)) {
      throw new NoticeNotFoundException()
    }

    const notice = await Notice.query()
      .where('id', noticeId)
      .where('ministryId', ministryId)
      .first()
    if (!notice) {
      throw new NoticeNotFoundException()
    }
    return notice
  }
}

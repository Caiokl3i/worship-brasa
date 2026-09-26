import type Notice from '#models/notice'

export function toNotice(notice: Notice) {
  return {
    id: notice.id,
    title: notice.title,
    body: notice.body,
    pinned: notice.pinned,
    expiresAt: notice.expiresAt?.toISODate() ?? null,
    archivedAt: notice.archivedAt?.toUTC().toISO() ?? null,
    createdAt: notice.createdAt.toUTC().toISO(),
    updatedAt: notice.updatedAt?.toUTC().toISO() ?? null,
    author: {
      membershipId: notice.membershipId,
      name: notice.membership.user.name,
    },
  }
}

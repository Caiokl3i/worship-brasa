export type NoticeItem = {
  id: string
  title: string
  body: string
  pinned: boolean
  expiresAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string | null
  author: {
    membershipId: string
    name: string
  }
}

export type NoticeLists = {
  notices: NoticeItem[]
  pinned: NoticeItem[]
  archived: NoticeItem[]
}

export function formatNoticeDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

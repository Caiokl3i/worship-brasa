export type ChatMessageItem = {
  id: string
  body: string
  createdAt: string
  author: {
    membershipId: string
    name: string
  }
}

export type ChatPage = {
  messages: ChatMessageItem[]
  hasMore: boolean
}

export function mergeMessages(current: ChatMessageItem[], incoming: ChatMessageItem[]) {
  const byId = new Map(current.map((item) => [item.id, item]))
  for (const item of incoming) {
    byId.set(item.id, item)
  }
  return [...byId.values()].sort((left, right) => {
    const byTime = left.createdAt.localeCompare(right.createdAt)
    return byTime === 0 ? left.id.localeCompare(right.id) : byTime
  })
}

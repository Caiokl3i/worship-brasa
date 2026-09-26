export type NotificationItem = {
  id: string
  type: string
  title: string
  body: string
  link: string
  ministryId: string
  readAt: string | null
  createdAt: string
}

export type NotificationList = {
  unreadCount: number
  notifications: NotificationItem[]
}

export type NotificationPreference = {
  type: string
  label: string
  group: 'escala' | 'ministerio'
  inApp: boolean
  email: boolean
}

export type NotificationPreferences = {
  preferences: NotificationPreference[]
}

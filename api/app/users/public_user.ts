import type User from '#models/user'
import { calendarStatus } from '#services/calendar_sync'

export type PublicUser = {
  id: string
  name: string
  email: string
  birthDate: string | null
  calendarConnected: boolean
}

export async function toPublicUser(user: User): Promise<PublicUser> {
  const calendar = await calendarStatus(user.id)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    birthDate: user.birthDate ? user.birthDate.toISODate() : null,
    calendarConnected: calendar.connected,
  }
}

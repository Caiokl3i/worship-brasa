import type User from '#models/user'

export type PublicUser = {
  id: string
  name: string
  email: string
  birthDate: string | null
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    birthDate: user.birthDate ? user.birthDate.toISODate() : null,
  }
}

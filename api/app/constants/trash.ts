import { DateTime } from 'luxon'

const TRASH_DAYS = 30

export function trashSince() {
  return DateTime.utc().minus({ days: TRASH_DAYS })
}

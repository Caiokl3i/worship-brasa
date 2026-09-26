export type ConfirmationCounts = {
  pending: number
  confirmed: number
  declined: number
}

export type ReportOverview = {
  schedules: number
  participations: number
  assignments: number
  confirmations: ConfirmationCounts
  absences: number
}

export type ReportMember = {
  membershipId: string
  name: string
  schedules: number
  assignments: number
}

export type ReportRange = {
  members: ReportMember[]
  idle: { membershipId: string; name: string }[]
  absences: { membershipId: string; name: string; count: number }[]
  songs: { title: string; artist: string | null; count: number }[]
  confirmations: ConfirmationCounts
}

export type PanoramaPerson = {
  name: string
  scheduleId: string
  conflicts: { kind: 'schedule' | 'unavailability' }[]
}

export type Panorama = {
  month: string
  days: string[]
  rows: {
    functionId: string
    name: string
    cells: { date: string; people: PanoramaPerson[] }[]
  }[]
}

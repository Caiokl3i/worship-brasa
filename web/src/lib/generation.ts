export type GenerationDefaults = {
  peopleStrategy: string
  historyMonths: number
  minGapDays: number | null
  preferFewerAbsences: boolean
  allowMultipleFunctions: boolean
  unavailability: string
  conflict: string
  songStrategy: string
  songCount: number
  minSongGapDays: number | null
  includeUnplayed: boolean
  vacancies: Array<{ functionId: string; quantity: number }>
}

export type ProposalPerson = {
  membershipId: string
  name: string
  reason: string
  fixed: boolean
}

export type Proposal = {
  vacancies: Array<{
    functionId: string
    functionName: string
    quantity: number
    missing: number
    people: ProposalPerson[]
  }>
  songs: Array<{
    songId: string
    title: string
    artist: string | null
    versionId: string | null
    defaultKey: string | null
    reason: string
  }>
  warnings: string[]
}

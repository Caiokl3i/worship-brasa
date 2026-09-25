export const WORSHIP_FUNCTIONS = [
  'Ministro',
  'Vocal',
  'Backing vocal',
  'Violão',
  'Guitarra',
  'Baixo',
  'Teclado',
  'Bateria',
  'Percussão',
]

export const BRAZIL_TIMEZONES = [
  'America/Noronha',
  'America/Sao_Paulo',
  'America/Bahia',
  'America/Fortaleza',
  'America/Recife',
  'America/Belem',
  'America/Manaus',
  'America/Cuiaba',
  'America/Porto_Velho',
  'America/Boa_Vista',
  'America/Rio_Branco',
]

export type MinistrySummary = {
  id: string
  name: string
  timezone: string
  color: string
  musicModuleEnabled: boolean
  membershipId: string
}

export type PendingJoin = {
  membershipId: string
  ministryId: string
  ministryName: string
}

export type MinistryList = {
  active: MinistrySummary[]
  pending: PendingJoin[]
}

export type MembershipAccess = {
  id: string
  isAdmin: boolean
  canManageSchedules: boolean
  canManageRepertoire: boolean
  canManageFunctions: boolean
  canEditScheduleSongs: boolean
}

export type MinistryDetail = {
  id: string
  name: string
  timezone: string
  color: string
  musicModuleEnabled: boolean
  membership: MembershipAccess
}

export type MinistryFunctionItem = {
  id: string
  name: string
  sortOrder: number
  archived: boolean
}

export type MemberItem = {
  membershipId: string
  name: string
  isAdmin: boolean
  functions: Array<{ id: string; name: string; archived: boolean }>
  canManageSchedules?: boolean
  canManageRepertoire?: boolean
  canManageFunctions?: boolean
  canEditScheduleSongs?: boolean
}

export type InviteInfo = {
  code: string
  expiresAt: string
  expired: boolean
  path: string
}

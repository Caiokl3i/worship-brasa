import { DateTime } from 'luxon'

export type PeopleStrategy = 'balanced' | 'most_active' | 'least_active' | 'weekday'
export type SongStrategy = 'rotation' | 'most_played' | 'balanced'
export type UnavailabilityMode = 'respect' | 'warn'
export type ConflictMode = 'skip' | 'warn' | 'ignore'

export type GenerationVacancy = {
  functionId: string
  functionName: string
  quantity: number
}

export type GenerationMember = {
  membershipId: string
  name: string
  functionIds: string[]
  participations: { startsAt: string; absent: boolean }[]
  unavailable: boolean
  hasScheduleConflict: boolean
}

export type GenerationSong = {
  songId: string
  title: string
  artist: string | null
  versionId: string | null
  defaultKey: string | null
  plays: string[]
}

export type GenerationSnapshot = {
  zone: string
  startsAt: string
  peopleStrategy: PeopleStrategy
  historyMonths: number
  minGapDays: number | null
  preferFewerAbsences: boolean
  allowMultipleFunctions: boolean
  unavailability: UnavailabilityMode
  conflict: ConflictMode
  vacancies: GenerationVacancy[]
  excludedMembershipIds: string[]
  fixed: { membershipId: string; functionIds: string[] }[]
  songStrategy: SongStrategy
  songCount: number
  minSongGapDays: number | null
  includeUnplayed: boolean
  members: GenerationMember[]
  songs: GenerationSong[]
}

export type ProposalPerson = {
  membershipId: string
  name: string
  reason: string
  fixed: boolean
}

export type ProposalVacancy = {
  functionId: string
  functionName: string
  quantity: number
  missing: number
  people: ProposalPerson[]
}

export type ProposalSong = {
  songId: string
  title: string
  artist: string | null
  versionId: string | null
  defaultKey: string | null
  reason: string
}

export type Proposal = {
  vacancies: ProposalVacancy[]
  songs: ProposalSong[]
  warnings: string[]
}

type RankedMember = GenerationMember & {
  count: number
  absences: number
  weekdayCount: number
  oldestAt: number | null
  newestAt: number | null
  lastAt: string | null
}

type RankedSong = GenerationSong & {
  playsInWindow: number
  lastPlayedAt: string | null
  lastPlayedMillis: number | null
}

export function generateProposal(snapshot: GenerationSnapshot): Proposal {
  const start = DateTime.fromISO(snapshot.startsAt, { setZone: true }).setZone(snapshot.zone)
  const windowStart = start.minus({ months: snapshot.historyMonths })
  const weekday = start.weekday
  const members = new Map(snapshot.members.map((member) => [member.membershipId, member]))
  const ranked = snapshot.members.map((member) =>
    rankMember(member, start, windowStart, snapshot.zone, weekday)
  )

  const fixedByFunction = new Map<string, ProposalPerson[]>()
  const used = new Set<string>()
  for (const entry of snapshot.fixed) {
    const member = members.get(entry.membershipId)
    if (!member) {
      continue
    }
    if (!snapshot.allowMultipleFunctions) {
      used.add(entry.membershipId)
    }
    for (const functionId of entry.functionIds) {
      const list = fixedByFunction.get(functionId) ?? []
      if (list.some((person) => person.membershipId === entry.membershipId)) {
        continue
      }
      list.push({
        membershipId: member.membershipId,
        name: member.name,
        reason: 'fixo',
        fixed: true,
      })
      fixedByFunction.set(functionId, list)
    }
  }

  const warnings: string[] = []
  const vacancies = snapshot.vacancies.map((vacancy) => {
    const fixedPeople = fixedByFunction.get(vacancy.functionId) ?? []
    const slots = Math.max(0, vacancy.quantity - fixedPeople.length)
    const placed = new Set(fixedPeople.map((person) => person.membershipId))
    const picked =
      slots === 0
        ? []
        : choosePeople(ranked, vacancy.functionId, slots, placed, used, snapshot, start)
    const missing = Math.max(0, slots - picked.length)
    if (missing > 0) {
      warnings.push(missingPeople(missing, vacancy.functionName))
    }
    return {
      functionId: vacancy.functionId,
      functionName: vacancy.functionName,
      quantity: vacancy.quantity,
      missing,
      people: [
        ...fixedPeople,
        ...picked.map((member) => ({
          membershipId: member.membershipId,
          name: member.name,
          reason: personReason(member, snapshot),
          fixed: false,
        })),
      ],
    }
  })

  const songs = chooseSongs(snapshot, start, windowStart)
  const songGap = Math.max(0, snapshot.songCount - songs.length)
  if (songGap > 0) {
    warnings.push(songGap === 1 ? 'Faltou 1 música.' : `Faltaram ${songGap} músicas.`)
  }

  return { vacancies, songs, warnings }
}

function rankMember(
  member: GenerationMember,
  start: DateTime,
  windowStart: DateTime,
  zone: string,
  weekday: number
): RankedMember {
  let count = 0
  let absences = 0
  let weekdayCount = 0
  let oldestAt: number | null = null
  let newestAt: number | null = null
  let lastMillis: number | null = null
  let lastAt: string | null = null

  for (const participation of member.participations) {
    const at = DateTime.fromISO(participation.startsAt, { setZone: true })
    if (!at.isValid || at.toMillis() >= start.toMillis()) {
      continue
    }
    if (lastMillis === null || at.toMillis() > lastMillis) {
      lastMillis = at.toMillis()
      lastAt = participation.startsAt
    }
    if (at.toMillis() < windowStart.toMillis()) {
      continue
    }
    count += 1
    if (participation.absent) {
      absences += 1
    }
    if (at.setZone(zone).weekday === weekday) {
      weekdayCount += 1
    }
    if (oldestAt === null || at.toMillis() < oldestAt) {
      oldestAt = at.toMillis()
    }
    if (newestAt === null || at.toMillis() > newestAt) {
      newestAt = at.toMillis()
    }
  }

  return { ...member, count, absences, weekdayCount, oldestAt, newestAt, lastAt }
}

function choosePeople(
  members: RankedMember[],
  functionId: string,
  slots: number,
  placed: Set<string>,
  used: Set<string>,
  snapshot: GenerationSnapshot,
  start: DateTime
) {
  const eligible = members.filter((member) => {
    if (!member.functionIds.includes(functionId) || placed.has(member.membershipId)) {
      return false
    }
    if (snapshot.excludedMembershipIds.includes(member.membershipId)) {
      return false
    }
    if (!snapshot.allowMultipleFunctions && used.has(member.membershipId)) {
      return false
    }
    if (insideGap(member.lastAt, start, snapshot.zone, snapshot.minGapDays)) {
      return false
    }
    if (member.unavailable && snapshot.unavailability === 'respect') {
      return false
    }
    if (member.hasScheduleConflict && snapshot.conflict === 'skip') {
      return false
    }
    return true
  })

  eligible.sort((left, right) => comparePeople(left, right, snapshot))
  const chosen = eligible.slice(0, slots)
  if (!snapshot.allowMultipleFunctions) {
    for (const member of chosen) {
      used.add(member.membershipId)
    }
  }
  return chosen
}

function comparePeople(left: RankedMember, right: RankedMember, snapshot: GenerationSnapshot) {
  if (snapshot.peopleStrategy === 'most_active') {
    return compareCount(left, right, snapshot, 'desc', 'newest')
  }
  if (snapshot.peopleStrategy === 'least_active') {
    return compareCount(left, right, snapshot, 'asc', 'newest')
  }
  if (snapshot.peopleStrategy === 'weekday' && left.weekdayCount !== right.weekdayCount) {
    return right.weekdayCount - left.weekdayCount
  }
  return compareCount(left, right, snapshot, 'asc', 'oldest')
}

function compareCount(
  left: RankedMember,
  right: RankedMember,
  snapshot: GenerationSnapshot,
  direction: 'asc' | 'desc',
  tie: 'oldest' | 'newest'
) {
  if (left.count !== right.count) {
    return direction === 'asc' ? left.count - right.count : right.count - left.count
  }
  if (snapshot.preferFewerAbsences && left.absences !== right.absences) {
    return left.absences - right.absences
  }
  const date = compareDate(left, right, tie)
  if (date !== 0) {
    return date
  }
  return left.name.localeCompare(right.name, 'pt')
}

function compareDate(left: RankedMember, right: RankedMember, tie: 'oldest' | 'newest') {
  const leftAt = tie === 'oldest' ? left.oldestAt : left.newestAt
  const rightAt = tie === 'oldest' ? right.oldestAt : right.newestAt
  if (leftAt === null && rightAt === null) {
    return 0
  }
  if (leftAt === null) {
    return tie === 'oldest' ? -1 : 1
  }
  if (rightAt === null) {
    return tie === 'oldest' ? 1 : -1
  }
  return tie === 'oldest' ? leftAt - rightAt : rightAt - leftAt
}

function personReason(member: RankedMember, snapshot: GenerationSnapshot) {
  const parts: string[] = []
  if (member.count === 0 && member.lastAt === null) {
    parts.push('nunca escalado')
  } else {
    const scales = member.count === 1 ? '1 escala' : `${member.count} escalas`
    const period =
      snapshot.historyMonths === 1 ? 'no último mês' : `nos últimos ${snapshot.historyMonths} meses`
    parts.push(`${scales} ${period}`)
  }
  if (member.lastAt) {
    parts.push(`última vez em ${writtenDate(member.lastAt, snapshot.zone)}`)
  }
  if (member.unavailable && snapshot.unavailability === 'warn') {
    parts.push('indisponível — incluído porque você permitiu aviso')
  }
  if (member.hasScheduleConflict && snapshot.conflict === 'warn') {
    parts.push('conflito com outra escala — incluído porque você permitiu aviso')
  }
  return parts.join('. ')
}

function chooseSongs(snapshot: GenerationSnapshot, start: DateTime, windowStart: DateTime) {
  const ranked: RankedSong[] = snapshot.songs
    .map((song) => rankSong(song, start, windowStart))
    .filter((song) => !insideGap(song.lastPlayedAt, start, snapshot.zone, snapshot.minSongGapDays))

  ranked.sort((left, right) => compareSongs(left, right, snapshot))
  return ranked.slice(0, snapshot.songCount).map((song) => ({
    songId: song.songId,
    title: song.title,
    artist: song.artist,
    versionId: song.versionId,
    defaultKey: song.defaultKey,
    reason: song.lastPlayedAt
      ? `última vez em ${writtenDate(song.lastPlayedAt, snapshot.zone)}`
      : 'ainda não tocada',
  }))
}

function rankSong(song: GenerationSong, start: DateTime, windowStart: DateTime): RankedSong {
  let playsInWindow = 0
  let lastPlayedAt: string | null = null
  let lastPlayedMillis: number | null = null
  for (const play of song.plays) {
    const at = DateTime.fromISO(play, { setZone: true })
    if (!at.isValid || at.toMillis() >= start.toMillis()) {
      continue
    }
    if (lastPlayedMillis === null || at.toMillis() > lastPlayedMillis) {
      lastPlayedMillis = at.toMillis()
      lastPlayedAt = play
    }
    if (at.toMillis() >= windowStart.toMillis()) {
      playsInWindow += 1
    }
  }
  return { ...song, playsInWindow, lastPlayedAt, lastPlayedMillis }
}

function compareSongs(left: RankedSong, right: RankedSong, snapshot: GenerationSnapshot) {
  if (snapshot.songStrategy === 'most_played' && left.playsInWindow !== right.playsInWindow) {
    return right.playsInWindow - left.playsInWindow
  }
  if (snapshot.songStrategy === 'balanced' && left.playsInWindow !== right.playsInWindow) {
    return left.playsInWindow - right.playsInWindow
  }
  if (snapshot.songStrategy === 'rotation') {
    const rotation = compareRotation(left, right, snapshot.includeUnplayed)
    if (rotation !== 0) {
      return rotation
    }
  }
  return left.title.localeCompare(right.title, 'pt')
}

function compareRotation(left: RankedSong, right: RankedSong, includeUnplayed: boolean) {
  const leftNew = left.lastPlayedAt === null
  const rightNew = right.lastPlayedAt === null
  if (leftNew !== rightNew) {
    if (includeUnplayed) {
      return leftNew ? -1 : 1
    }
    return leftNew ? 1 : -1
  }
  if (left.lastPlayedMillis === null || right.lastPlayedMillis === null) {
    return 0
  }
  return left.lastPlayedMillis - right.lastPlayedMillis
}

function insideGap(lastAt: string | null, start: DateTime, zone: string, days: number | null) {
  if (days === null || days <= 0 || !lastAt) {
    return false
  }
  const last = DateTime.fromISO(lastAt, { setZone: true }).setZone(zone).startOf('day')
  const day = start.setZone(zone).startOf('day')
  return day.diff(last, 'days').days < days
}

function writtenDate(iso: string, zone: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    timeZone: zone,
  }).format(new Date(iso))
}

function missingPeople(missing: number, functionName: string) {
  if (missing === 1) {
    return `Faltou 1 pessoa em ${functionName}.`
  }
  return `Faltaram ${missing} pessoas em ${functionName}.`
}

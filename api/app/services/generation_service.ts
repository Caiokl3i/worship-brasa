import type Membership from '#models/membership'
import MembershipModel from '#models/membership'
import Ministry from '#models/ministry'
import MinistryFunction from '#models/ministry_function'
import MinistryGenerationDefault from '#models/ministry_generation_default'
import Schedule from '#models/schedule'
import Song from '#models/song'
import {
  FieldException,
  ForbiddenActionException,
  ScheduleNotFoundException,
} from '#exceptions/ministry_exceptions'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import { findConflicts } from '#schedules/conflicts'
import {
  generateProposal,
  type ConflictMode,
  type GenerationSnapshot,
  type PeopleStrategy,
  type SongStrategy,
  type UnavailabilityMode,
} from '#schedules/generation'

const DEFAULTS = {
  peopleStrategy: 'balanced' as const,
  historyMonths: 3,
  minGapDays: null as number | null,
  preferFewerAbsences: false,
  allowMultipleFunctions: false,
  unavailability: 'respect' as const,
  conflict: 'skip' as const,
  songStrategy: 'rotation' as const,
  songCount: 4,
  minSongGapDays: null as number | null,
  includeUnplayed: true,
  vacancies: [] as { functionId: string; quantity: number }[],
}

type GenerationOptions = {
  peopleStrategy: PeopleStrategy
  historyMonths: number
  minGapDays?: number | null
  preferFewerAbsences: boolean
  allowMultipleFunctions: boolean
  unavailability: UnavailabilityMode
  conflict: ConflictMode
  songStrategy: SongStrategy
  songCount: number
  minSongGapDays?: number | null
  includeUnplayed: boolean
  vacancies: { functionId: string; quantity: number }[]
}

type SuggestOptions = GenerationOptions & {
  fixed: { membershipId: string; functionIds: string[] }[]
  excludedMembershipIds: string[]
}

export default class GenerationService {
  async defaults(actor: Membership) {
    this.#assertManager(actor)
    const row = await MinistryGenerationDefault.query()
      .where('ministryId', actor.ministryId)
      .first()
    if (!row) {
      return DEFAULTS
    }
    return this.#present(row)
  }

  async saveDefaults(actor: Membership, input: GenerationOptions) {
    this.#assertManager(actor)
    const existing = await MinistryGenerationDefault.query()
      .where('ministryId', actor.ministryId)
      .first()
    const row = existing ?? new MinistryGenerationDefault()
    row.ministryId = actor.ministryId
    this.#fill(row, input)
    await row.save()
    return this.#present(row)
  }

  async suggest(actor: Membership, scheduleId: string, input: SuggestOptions) {
    const schedule = await this.#schedule(actor, scheduleId)
    const ministry = await Ministry.findOrFail(actor.ministryId)
    const functions = await MinistryFunction.query().where('ministryId', actor.ministryId)
    const names = new Map(functions.map((item) => [item.id, item.name]))
    const vacancies = this.#vacancies(input.vacancies, names)
    for (const entry of input.fixed) {
      for (const functionId of entry.functionIds) {
        if (!names.has(functionId)) {
          throw new FieldException('fixed', 'Escolha uma função do ministério.')
        }
      }
    }

    const active = await MembershipModel.query()
      .where('ministryId', actor.ministryId)
      .where('status', 'active')
      .preload('user')
      .preload('functions')
    const activeIds = new Set(active.map((member) => member.id))
    for (const entry of input.fixed) {
      if (!activeIds.has(entry.membershipId)) {
        throw new FieldException('fixed', 'Este membro não pode entrar nesta escala.')
      }
    }

    const history = await Schedule.query()
      .where('ministryId', actor.ministryId)
      .where('status', 'published')
      .whereNull('deletedAt')
      .whereNot('id', schedule.id)
      .preload('participants')
      .preload('songs')

    const participations = new Map<string, { startsAt: string; absent: boolean }[]>()
    const plays = new Map<string, string[]>()
    for (const item of history) {
      const startsAt = item.startsAt.toISO()
      if (!startsAt) {
        continue
      }
      for (const participant of item.participants) {
        const list = participations.get(participant.membershipId) ?? []
        list.push({ startsAt, absent: participant.absent })
        participations.set(participant.membershipId, list)
      }
      for (const placement of item.songs) {
        const list = plays.get(placement.songId) ?? []
        list.push(startsAt)
        plays.set(placement.songId, list)
      }
    }

    const members = []
    for (const member of active) {
      const conflicts = await findConflicts(
        member.id,
        schedule.startsAt,
        schedule.endsAt,
        schedule.id,
        { includeDrafts: true }
      )
      members.push({
        membershipId: member.id,
        name: member.user.name,
        functionIds: member.functions.map((item) => item.id),
        participations: participations.get(member.id) ?? [],
        unavailable: conflicts.some((conflict) => conflict.kind === 'unavailability'),
        hasScheduleConflict: conflicts.some((conflict) => conflict.kind === 'schedule'),
      })
    }

    const catalog = await Song.query()
      .where('ministryId', actor.ministryId)
      .whereNull('deletedAt')
      .preload('versions', (versions) => versions.orderBy('createdAt', 'asc'))

    const startsAt = schedule.startsAt.toISO()
    if (!startsAt) {
      throw new ScheduleNotFoundException()
    }

    const snapshot: GenerationSnapshot = {
      zone: ministry.timezone,
      startsAt,
      peopleStrategy: input.peopleStrategy,
      historyMonths: input.historyMonths,
      minGapDays: input.minGapDays ?? null,
      preferFewerAbsences: input.preferFewerAbsences,
      allowMultipleFunctions: input.allowMultipleFunctions,
      unavailability: input.unavailability,
      conflict: input.conflict,
      vacancies,
      excludedMembershipIds: input.excludedMembershipIds,
      fixed: input.fixed,
      songStrategy: input.songStrategy,
      songCount: input.songCount,
      minSongGapDays: input.minSongGapDays ?? null,
      includeUnplayed: input.includeUnplayed,
      members,
      songs: catalog.map((song) => ({
        songId: song.id,
        title: song.title,
        artist: song.artist,
        versionId: song.versions[0]?.id ?? null,
        defaultKey: song.defaultKey,
        plays: plays.get(song.id) ?? [],
      })),
    }

    return generateProposal(snapshot)
  }

  #assertManager(actor: Membership) {
    new MembershipAccessService().assertCanManageSchedules(actor)
  }

  async #schedule(actor: Membership, scheduleId: string) {
    if (!isUuid(scheduleId)) {
      throw new ScheduleNotFoundException()
    }

    const schedule = await Schedule.query()
      .where('id', scheduleId)
      .where('ministryId', actor.ministryId)
      .whereNull('deletedAt')
      .first()

    if (!schedule) {
      throw new ScheduleNotFoundException()
    }

    const manages = new MembershipAccessService().managesSchedules(actor)
    if (schedule.status === 'draft' && !manages) {
      throw new ScheduleNotFoundException()
    }
    if (!manages) {
      throw new ForbiddenActionException()
    }

    return schedule
  }

  #vacancies(rows: { functionId: string; quantity: number }[], names: Map<string, string>) {
    const merged: { functionId: string; functionName: string; quantity: number }[] = []
    for (const row of rows) {
      const functionName = names.get(row.functionId)
      if (!functionName) {
        throw new FieldException('vacancies', 'Escolha uma função do ministério.')
      }
      const existing = merged.find((item) => item.functionId === row.functionId)
      if (existing) {
        existing.quantity += row.quantity
      } else {
        merged.push({ functionId: row.functionId, functionName, quantity: row.quantity })
      }
    }
    return merged
  }

  #fill(row: MinistryGenerationDefault, input: GenerationOptions) {
    row.peopleStrategy = input.peopleStrategy
    row.historyMonths = input.historyMonths
    row.minGapDays = input.minGapDays ?? null
    row.preferFewerAbsences = input.preferFewerAbsences
    row.allowMultipleFunctions = input.allowMultipleFunctions
    row.unavailabilityMode = input.unavailability
    row.conflictMode = input.conflict
    row.songStrategy = input.songStrategy
    row.songCount = input.songCount
    row.minSongGapDays = input.minSongGapDays ?? null
    row.includeUnplayed = input.includeUnplayed
    row.vacancies = JSON.stringify(input.vacancies)
  }

  #present(row: MinistryGenerationDefault) {
    return {
      peopleStrategy: row.peopleStrategy,
      historyMonths: row.historyMonths,
      minGapDays: row.minGapDays,
      preferFewerAbsences: row.preferFewerAbsences,
      allowMultipleFunctions: row.allowMultipleFunctions,
      unavailability: row.unavailabilityMode,
      conflict: row.conflictMode,
      songStrategy: row.songStrategy,
      songCount: row.songCount,
      minSongGapDays: row.minSongGapDays,
      includeUnplayed: row.includeUnplayed,
      vacancies: this.#readVacancies(row.vacancies),
    }
  }

  #readVacancies(raw: string) {
    try {
      const parsed = JSON.parse(raw) as { functionId?: string; quantity?: number }[]
      if (!Array.isArray(parsed)) {
        return []
      }
      return parsed.flatMap((item) =>
        item.functionId && typeof item.quantity === 'number'
          ? [{ functionId: item.functionId, quantity: item.quantity }]
          : []
      )
    } catch {
      return []
    }
  }
}

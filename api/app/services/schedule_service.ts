import { DateTime } from 'luxon'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'
import Membership from '#models/membership'
import Ministry from '#models/ministry'
import MinistryFunction from '#models/ministry_function'
import Schedule from '#models/schedule'
import ScheduleAssignment from '#models/schedule_assignment'
import ScheduleParticipant from '#models/schedule_participant'
import ScheduleSong from '#models/schedule_song'
import ScheduleSongHighlight from '#models/schedule_song_highlight'
import Song from '#models/song'
import SongVersion from '#models/song_version'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import {
  FieldException,
  ForbiddenActionException,
  ScheduleConflictException,
  ScheduleNotFoundException,
} from '#exceptions/ministry_exceptions'
import { SONG_KEYS } from '#ministries/repertoire'

type HighlightInput = {
  membershipId: string
  functionId: string
}

type ParticipantInput = {
  membershipId: string
  functionIds: string[]
}

type SongInput = {
  songId: string
  versionId?: string | null
  keyOverride?: string | null
  notes?: string | null
  durationSeconds?: number | null
  highlights: HighlightInput[]
}

export type ScheduleWriteInput = {
  version: number
  title: string
  startsAt: string
  endsAt?: string | null
  notes?: string | null
  dressCode?: string | null
  participants: ParticipantInput[]
  songs: SongInput[]
}

export type ScheduleCreateInput = {
  title: string
  startsAt: string
  endsAt?: string | null
  notes?: string | null
  dressCode?: string | null
}

type PreparedWrite = {
  title: string
  startsAt: DateTime
  endsAt: DateTime | null
  notes: string
  dressCode: string
  participants: ParticipantInput[]
  songs: Array<SongInput & { keyOverride: string | null; versionId: string | null; notes: string }>
}

function blank(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : null
}

function parseMinistryTime(value: string, zone: string, field: string) {
  const hasZone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value.trim())
  const parsed = hasZone
    ? DateTime.fromISO(value.trim(), { setZone: true })
    : DateTime.fromISO(value.trim(), { zone })

  if (!parsed.isValid) {
    throw new FieldException(field, field === 'endsAt' ? 'Informe o término.' : 'Informe o início.')
  }

  return parsed.toUTC()
}

function sameInstant(left: DateTime | null, right: DateTime | null) {
  return (left?.toUTC().toMillis() ?? null) === (right?.toUTC().toMillis() ?? null)
}

function teamKey(participants: Array<{ membershipId: string; functionIds: string[] }>) {
  return JSON.stringify(
    participants
      .map((participant) => ({
        membershipId: participant.membershipId,
        functionIds: [...new Set(participant.functionIds)].sort(),
      }))
      .sort((left, right) => left.membershipId.localeCompare(right.membershipId))
  )
}

export default class ScheduleService {
  async list(actor: Membership) {
    const access = new MembershipAccessService()
    const query = Schedule.query().where('ministryId', actor.ministryId).whereNull('deletedAt')
    if (!access.managesSchedules(actor)) {
      query.where('status', 'published')
    }
    const rows = await query

    const now = DateTime.utc().toMillis()
    const upcoming = rows
      .filter((schedule) => schedule.startsAt.toMillis() >= now)
      .sort((left, right) => left.startsAt.toMillis() - right.startsAt.toMillis())
    const past = rows
      .filter((schedule) => schedule.startsAt.toMillis() < now)
      .sort((left, right) => right.startsAt.toMillis() - left.startsAt.toMillis())

    return { upcoming, past }
  }

  async show(actor: Membership, scheduleId: string) {
    return this.#loadVisible(actor, scheduleId)
  }

  async create(actor: Membership, input: ScheduleCreateInput) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    const zone = await this.#zone(actor.ministryId)
    const startsAt = parseMinistryTime(input.startsAt, zone, 'startsAt')
    const endsAt = blank(input.endsAt) ? parseMinistryTime(input.endsAt!, zone, 'endsAt') : null
    this.#assertRange(startsAt, endsAt)

    const schedule = await Schedule.create({
      ministryId: actor.ministryId,
      title: input.title.trim(),
      startsAt,
      endsAt,
      status: 'draft',
      notes: input.notes?.trim() ?? '',
      dressCode: input.dressCode?.trim() ?? '',
      version: 1,
    })

    return this.#loadVisible(actor, schedule.id)
  }

  async update(actor: Membership, scheduleId: string, input: ScheduleWriteInput) {
    return this.#write(actor, scheduleId, input, 'keep')
  }

  async publish(actor: Membership, scheduleId: string, input: ScheduleWriteInput) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    return this.#write(actor, scheduleId, input, 'published')
  }

  async unpublish(actor: Membership, scheduleId: string, input: ScheduleWriteInput) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    return this.#write(actor, scheduleId, input, 'draft')
  }

  async delete(actor: Membership, scheduleId: string) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    const schedule = await this.#find(actor.ministryId, scheduleId)
    schedule.deletedAt = DateTime.utc()
    await schedule.save()
  }

  async #write(
    actor: Membership,
    scheduleId: string,
    input: ScheduleWriteInput,
    nextStatus: 'keep' | 'draft' | 'published'
  ) {
    const access = new MembershipAccessService()
    const zone = await this.#zone(actor.ministryId)
    const prepared = this.#prepare(input, zone)

    await db.transaction(async (trx) => {
      if (!isUuid(scheduleId)) {
        throw new ScheduleNotFoundException()
      }

      const schedule = await Schedule.query({ client: trx })
        .where('id', scheduleId)
        .where('ministryId', actor.ministryId)
        .whereNull('deletedAt')
        .forUpdate()
        .first()

      if (!schedule) {
        throw new ScheduleNotFoundException()
      }

      if (schedule.status === 'draft' && !access.managesSchedules(actor)) {
        throw new ScheduleNotFoundException()
      }

      if (schedule.version !== input.version) {
        throw new ScheduleConflictException()
      }

      if (!access.editsScheduleSongs(actor)) {
        throw new ForbiddenActionException()
      }

      if (nextStatus !== 'keep' && !access.managesSchedules(actor)) {
        throw new ForbiddenActionException()
      }

      const currentParticipants = await ScheduleParticipant.query({ client: trx })
        .where('scheduleId', schedule.id)
        .preload('assignments')

      if (!access.managesSchedules(actor)) {
        const sameData =
          schedule.title === prepared.title &&
          schedule.notes === prepared.notes &&
          schedule.dressCode === prepared.dressCode &&
          sameInstant(schedule.startsAt, prepared.startsAt) &&
          sameInstant(schedule.endsAt, prepared.endsAt)
        const sameTeam =
          teamKey(
            currentParticipants.map((participant) => ({
              membershipId: participant.membershipId,
              functionIds: participant.assignments.map((assignment) => assignment.functionId),
            }))
          ) === teamKey(prepared.participants)

        if (!sameData || !sameTeam) {
          throw new ForbiddenActionException()
        }
      }

      const previousFunctions = new Map(
        currentParticipants.map((participant) => [
          participant.membershipId,
          new Set(participant.assignments.map((assignment) => assignment.functionId)),
        ])
      )

      await this.#assertTeam(actor.ministryId, prepared.participants, previousFunctions, trx)
      await this.#assertSongs(actor.ministryId, prepared, trx)

      await this.#replaceChildren(schedule.id, prepared, trx)

      schedule.useTransaction(trx)
      schedule.title = prepared.title
      schedule.startsAt = prepared.startsAt
      schedule.endsAt = prepared.endsAt
      schedule.notes = prepared.notes
      schedule.dressCode = prepared.dressCode
      if (nextStatus !== 'keep') {
        schedule.status = nextStatus
      }
      schedule.version += 1
      await schedule.save()
    })

    return this.#loadVisible(actor, scheduleId)
  }

  #prepare(input: ScheduleWriteInput, zone: string): PreparedWrite {
    if (!Number.isInteger(input.version)) {
      throw new FieldException('version', 'Esta escala foi alterada, reabra.')
    }

    const startsAt = parseMinistryTime(input.startsAt, zone, 'startsAt')
    const endsAt = blank(input.endsAt) ? parseMinistryTime(input.endsAt!, zone, 'endsAt') : null
    this.#assertRange(startsAt, endsAt)

    const seen = new Set<string>()
    const participants = input.participants.map((participant) => {
      if (seen.has(participant.membershipId)) {
        throw new FieldException('participants', 'Este membro já está na equipe.')
      }
      seen.add(participant.membershipId)
      return {
        membershipId: participant.membershipId,
        functionIds: [...new Set(participant.functionIds)],
      }
    })

    return {
      title: input.title.trim(),
      startsAt,
      endsAt,
      notes: input.notes?.trim() ?? '',
      dressCode: input.dressCode?.trim() ?? '',
      participants,
      songs: input.songs.map((song) => ({
        ...song,
        versionId: blank(song.versionId),
        keyOverride: this.#key(song.keyOverride),
        notes: song.notes?.trim() ?? '',
        highlights: song.highlights,
      })),
    }
  }

  #key(value: string | null | undefined) {
    const key = blank(value)
    if (!key) {
      return null
    }
    if (!SONG_KEYS.includes(key as (typeof SONG_KEYS)[number])) {
      throw new FieldException('keyOverride', 'Informe um tom da lista.')
    }
    return key
  }

  #assertRange(startsAt: DateTime, endsAt: DateTime | null) {
    if (endsAt && endsAt.toMillis() <= startsAt.toMillis()) {
      throw new FieldException('endsAt', 'O término precisa ser depois do início.')
    }
  }

  async #assertTeam(
    ministryId: string,
    participants: ParticipantInput[],
    previousFunctions: Map<string, Set<string>>,
    trx: TransactionClientContract
  ) {
    for (const participant of participants) {
      if (!isUuid(participant.membershipId)) {
        throw new FieldException('participants', 'Este membro não pode entrar nesta escala.')
      }

      const membership = await Membership.query({ client: trx })
        .where('id', participant.membershipId)
        .where('ministryId', ministryId)
        .where('status', 'active')
        .first()

      if (!membership) {
        throw new FieldException('participants', 'Este membro não pode entrar nesta escala.')
      }

      if (participant.functionIds.length === 0) {
        throw new FieldException('functionIds', 'Escolha ao menos uma função.')
      }

      for (const functionId of participant.functionIds) {
        if (!isUuid(functionId)) {
          throw new FieldException('functionIds', 'Esta função não pode ser atribuída.')
        }

        const ministryFunction = await MinistryFunction.query({ client: trx })
          .where('id', functionId)
          .where('ministryId', ministryId)
          .first()
        const already = previousFunctions.get(participant.membershipId)?.has(functionId) ?? false

        if (!ministryFunction || (ministryFunction.archivedAt && !already)) {
          throw new FieldException('functionIds', 'Esta função não pode ser atribuída.')
        }
      }
    }
  }

  async #assertSongs(ministryId: string, prepared: PreparedWrite, trx: TransactionClientContract) {
    const team = new Map(
      prepared.participants.map((participant) => [
        participant.membershipId,
        new Set(participant.functionIds),
      ])
    )

    for (const songInput of prepared.songs) {
      if (!isUuid(songInput.songId)) {
        throw new FieldException('songId', 'Esta música não pode entrar nesta escala.')
      }

      const song = await Song.query({ client: trx })
        .where('id', songInput.songId)
        .where('ministryId', ministryId)
        .whereNull('deletedAt')
        .first()

      if (!song) {
        throw new FieldException('songId', 'Esta música não pode entrar nesta escala.')
      }

      if (songInput.versionId) {
        if (!isUuid(songInput.versionId)) {
          throw new FieldException('versionId', 'Esta versão não pode ser usada.')
        }
        const version = await SongVersion.query({ client: trx })
          .where('id', songInput.versionId)
          .where('songId', song.id)
          .first()
        if (!version) {
          throw new FieldException('versionId', 'Esta versão não pode ser usada.')
        }
      }

      for (const highlight of songInput.highlights) {
        const functions = team.get(highlight.membershipId)
        if (!functions?.has(highlight.functionId)) {
          throw new FieldException('highlights', 'O destaque precisa ser de alguém da equipe.')
        }
      }
    }
  }

  async #replaceChildren(
    scheduleId: string,
    prepared: PreparedWrite,
    trx: TransactionClientContract
  ) {
    const currentSongs = await ScheduleSong.query({ client: trx }).where('scheduleId', scheduleId)
    const songIds = currentSongs.map((song) => song.id)
    if (songIds.length > 0) {
      await ScheduleSongHighlight.query({ client: trx }).whereIn('scheduleSongId', songIds).delete()
    }

    const currentParticipants = await ScheduleParticipant.query({ client: trx }).where(
      'scheduleId',
      scheduleId
    )
    const participantIds = currentParticipants.map((participant) => participant.id)
    if (participantIds.length > 0) {
      await ScheduleAssignment.query({ client: trx })
        .whereIn('participantId', participantIds)
        .delete()
    }

    await ScheduleParticipant.query({ client: trx }).where('scheduleId', scheduleId).delete()
    await ScheduleSong.query({ client: trx }).where('scheduleId', scheduleId).delete()

    const participants = new Map<string, ScheduleParticipant>()
    for (const participantInput of prepared.participants) {
      const participant = await ScheduleParticipant.create(
        { scheduleId, membershipId: participantInput.membershipId },
        { client: trx }
      )
      participants.set(participant.membershipId, participant)

      for (const functionId of participantInput.functionIds) {
        await ScheduleAssignment.create(
          { participantId: participant.id, functionId },
          { client: trx }
        )
      }
    }

    for (const [index, songInput] of prepared.songs.entries()) {
      const scheduleSong = await ScheduleSong.create(
        {
          scheduleId,
          songId: songInput.songId,
          versionId: songInput.versionId,
          position: index + 1,
          keyOverride: songInput.keyOverride,
          notes: songInput.notes,
          durationSeconds: songInput.durationSeconds ?? null,
        },
        { client: trx }
      )

      const seen = new Set<string>()
      for (const highlight of songInput.highlights) {
        const key = `${highlight.membershipId}:${highlight.functionId}`
        if (seen.has(key)) {
          continue
        }
        seen.add(key)
        const participant = participants.get(highlight.membershipId)
        if (!participant) {
          throw new FieldException('highlights', 'O destaque precisa ser de alguém da equipe.')
        }
        await ScheduleSongHighlight.create(
          {
            scheduleSongId: scheduleSong.id,
            participantId: participant.id,
            functionId: highlight.functionId,
          },
          { client: trx }
        )
      }
    }
  }

  async #zone(ministryId: string) {
    const ministry = await Ministry.findOrFail(ministryId)
    return ministry.timezone
  }

  async #find(ministryId: string, scheduleId: string) {
    if (!isUuid(scheduleId)) {
      throw new ScheduleNotFoundException()
    }

    const schedule = await Schedule.query()
      .where('id', scheduleId)
      .where('ministryId', ministryId)
      .whereNull('deletedAt')
      .first()

    if (!schedule) {
      throw new ScheduleNotFoundException()
    }

    return schedule
  }

  async #loadVisible(actor: Membership, scheduleId: string) {
    const schedule = await this.#find(actor.ministryId, scheduleId)
    if (schedule.status === 'draft' && !new MembershipAccessService().managesSchedules(actor)) {
      throw new ScheduleNotFoundException()
    }

    await schedule.load('participants')
    for (const participant of schedule.participants) {
      await participant.load('membership')
      await participant.membership.load('user')
      await participant.load('assignments')
      for (const assignment of participant.assignments) {
        await assignment.load('function')
      }
    }

    await schedule.load('songs', (songs) => songs.orderBy('position', 'asc'))
    for (const scheduleSong of schedule.songs) {
      await scheduleSong.load('song')
      await scheduleSong.song.load('links')
      if (scheduleSong.versionId) {
        await scheduleSong.load('version')
      }
      await scheduleSong.load('highlights')
    }

    schedule.participants.sort((left, right) =>
      left.membership.user.name.localeCompare(right.membership.user.name, 'pt')
    )

    return schedule
  }
}

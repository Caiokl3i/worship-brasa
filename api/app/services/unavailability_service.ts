import { DateTime } from 'luxon'
import Membership from '#models/membership'
import Unavailability from '#models/unavailability'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import {
  FieldException,
  ForbiddenActionException,
  UnavailabilityNotFoundException,
} from '#exceptions/ministry_exceptions'

export type UnavailabilityInput = {
  membershipId?: string
  startsOn: string
  endsOn: string
  description?: string | null
}

function parseDay(value: string, field: string) {
  const parsed = DateTime.fromISO(value, { zone: 'utc' })
  if (!parsed.isValid || parsed.toISODate() !== value) {
    throw new FieldException(
      field,
      field === 'endsOn' ? 'Informe a data final.' : 'Informe a data inicial.'
    )
  }
  return parsed.startOf('day')
}

function assertRange(startsOn: DateTime, endsOn: DateTime) {
  const start = startsOn.toISODate()
  const end = endsOn.toISODate()
  if (!start || !end || end < start) {
    throw new FieldException('endsOn', 'A data final precisa ser igual ou posterior à inicial.')
  }
}

export function toUnavailability(row: Unavailability, description: string | null) {
  return {
    id: row.id,
    membershipId: row.membershipId,
    name: row.membership.user.name,
    startsOn: row.startsOn.toISODate(),
    endsOn: row.endsOn.toISODate(),
    description,
  }
}

export default class UnavailabilityService {
  async list(actor: Membership) {
    const access = new MembershipAccessService()
    const rows = await Unavailability.query()
      .whereNull('deletedAt')
      .whereHas('membership', (membership) => {
        membership.where('ministryId', actor.ministryId)
      })
      .orderBy('startsOn', 'asc')

    for (const row of rows) {
      await row.load('membership')
      await row.membership.load('user')
    }

    return rows.map((row) =>
      toUnavailability(row, this.#description(actor, row, access.managesSchedules(actor)))
    )
  }

  async create(actor: Membership, input: UnavailabilityInput) {
    const targetId = await this.#target(actor, input.membershipId)
    const startsOn = parseDay(input.startsOn, 'startsOn')
    const endsOn = parseDay(input.endsOn, 'endsOn')
    assertRange(startsOn, endsOn)

    const row = await Unavailability.create({
      membershipId: targetId,
      startsOn,
      endsOn,
      description: input.description?.trim() ?? '',
    })
    await row.load('membership')
    await row.membership.load('user')
    return toUnavailability(row, row.description)
  }

  async update(actor: Membership, unavailabilityId: string, input: UnavailabilityInput) {
    const row = await this.#editable(actor, unavailabilityId)
    const startsOn = parseDay(input.startsOn, 'startsOn')
    const endsOn = parseDay(input.endsOn, 'endsOn')
    assertRange(startsOn, endsOn)
    row.startsOn = startsOn
    row.endsOn = endsOn
    row.description = input.description?.trim() ?? ''
    await row.save()
    await row.load('membership')
    await row.membership.load('user')
    return toUnavailability(row, row.description)
  }

  async delete(actor: Membership, unavailabilityId: string) {
    const row = await this.#editable(actor, unavailabilityId)
    row.deletedAt = DateTime.utc()
    await row.save()
  }

  #description(actor: Membership, row: Unavailability, manages: boolean) {
    if (row.membershipId === actor.id || manages) {
      return row.description
    }
    return null
  }

  async #target(actor: Membership, membershipId: string | undefined) {
    const targetId = membershipId || actor.id
    if (targetId !== actor.id) {
      new MembershipAccessService().assertCanManageSchedules(actor)
    }
    if (!isUuid(targetId)) {
      throw new FieldException('membershipId', 'Este membro não pode entrar nesta escala.')
    }

    const membership = await Membership.query()
      .where('id', targetId)
      .where('ministryId', actor.ministryId)
      .where('status', 'active')
      .first()
    if (!membership) {
      throw new FieldException('membershipId', 'Este membro não pode entrar nesta escala.')
    }
    return membership.id
  }

  async #editable(actor: Membership, unavailabilityId: string) {
    if (!isUuid(unavailabilityId)) {
      throw new UnavailabilityNotFoundException()
    }

    const row = await Unavailability.query()
      .where('id', unavailabilityId)
      .whereNull('deletedAt')
      .preload('membership')
      .first()

    if (!row || row.membership.ministryId !== actor.ministryId) {
      throw new UnavailabilityNotFoundException()
    }
    if (row.membershipId !== actor.id && !new MembershipAccessService().managesSchedules(actor)) {
      throw new ForbiddenActionException()
    }
    return row
  }
}

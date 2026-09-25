import db from '@adonisjs/lucid/services/db'
import { DEFAULT_TIMEZONE } from '#constants/timezone'
import Membership from '#models/membership'
import Ministry from '#models/ministry'
import Classification from '#models/classification'
import MinistryFunction from '#models/ministry_function'
import { DEFAULT_CLASSIFICATIONS } from '#ministries/repertoire'
import { DEFAULT_MINISTRY_COLOR, WORSHIP_FUNCTIONS } from '#ministries/worship_functions'
import MembershipAccessService from '#services/membership_access_service'
import { FieldException } from '#exceptions/ministry_exceptions'

type CreateInput = {
  name: string
  functions?: string[]
}

type UpdateInput = {
  name: string
  timezone: string
  color: string
}

function uniqueNames(names: string[]) {
  const seen = new Set<string>()
  const result: string[] = []

  for (const name of names) {
    const trimmed = name.trim()
    const key = trimmed.toLowerCase()
    if (!key || seen.has(key)) {
      continue
    }
    seen.add(key)
    result.push(trimmed)
  }

  return result
}

function assertTimezone(timezone: string) {
  if (!Intl.supportedValuesOf('timeZone').includes(timezone)) {
    throw new FieldException('timezone', 'Informe um fuso válido.')
  }
}

export default class MinistryService {
  async listFor(userId: string) {
    return Membership.query()
      .where('userId', userId)
      .whereIn('status', ['active', 'pending'])
      .preload('ministry')
      .orderBy('createdAt', 'asc')
  }

  async create(userId: string, input: CreateInput) {
    const names =
      input.functions === undefined ? [...WORSHIP_FUNCTIONS] : uniqueNames(input.functions)

    return db.transaction(async (trx) => {
      const ministry = await Ministry.create(
        {
          name: input.name,
          timezone: DEFAULT_TIMEZONE,
          color: DEFAULT_MINISTRY_COLOR,
          musicModuleEnabled: true,
        },
        { client: trx }
      )

      await Membership.create(
        {
          userId,
          ministryId: ministry.id,
          status: 'active',
          isAdmin: true,
          canManageSchedules: true,
          canManageRepertoire: true,
          canManageFunctions: true,
          canEditScheduleSongs: true,
        },
        { client: trx }
      )

      for (const [sortOrder, name] of names.entries()) {
        await MinistryFunction.create(
          {
            ministryId: ministry.id,
            name,
            sortOrder,
          },
          { client: trx }
        )
      }

      for (const [index, item] of DEFAULT_CLASSIFICATIONS.entries()) {
        const classification = new Classification()
        classification.fill({
          ministryId: ministry.id,
          name: item.name,
          description: item.description,
        })
        classification.createdAt = ministry.createdAt.plus({ milliseconds: index })
        classification.useTransaction(trx)
        await classification.save()
      }

      return ministry
    })
  }

  async update(actor: Membership, input: UpdateInput) {
    new MembershipAccessService().assertAdmin(actor)
    assertTimezone(input.timezone)

    const ministry = await Ministry.findOrFail(actor.ministryId)
    ministry.name = input.name
    ministry.timezone = input.timezone
    ministry.color = input.color.toLowerCase()
    await ministry.save()
    return ministry
  }

  async show(actor: Membership) {
    return Ministry.findOrFail(actor.ministryId)
  }

  async leave(actor: Membership) {
    await db.transaction(async (trx) => {
      actor.useTransaction(trx)

      if (actor.isAdmin) {
        const admins = await new MembershipAccessService().lockAdmins(actor.ministryId, trx)
        if (admins.length <= 1) {
          throw new FieldException('isAdmin', 'O ministério precisa de um administrador.')
        }
      }

      actor.status = 'left'
      actor.isAdmin = false
      actor.canManageSchedules = false
      actor.canManageRepertoire = false
      actor.canManageFunctions = false
      actor.canEditScheduleSongs = false
      await actor.save()
      await actor.related('functions').detach()
    })
  }
}

import db from '@adonisjs/lucid/services/db'
import Membership from '#models/membership'
import MinistryFunction from '#models/ministry_function'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import { FieldException, RequestNotFoundException } from '#exceptions/ministry_exceptions'

type FlagsInput = {
  isAdmin?: boolean
  canManageSchedules?: boolean
  canManageRepertoire?: boolean
  canManageFunctions?: boolean
  canEditScheduleSongs?: boolean
}

function applyFlags(membership: Membership, input: FlagsInput) {
  if (input.canManageSchedules !== undefined) {
    membership.canManageSchedules = input.canManageSchedules
  }
  if (input.canManageRepertoire !== undefined) {
    membership.canManageRepertoire = input.canManageRepertoire
  }
  if (input.canManageFunctions !== undefined) {
    membership.canManageFunctions = input.canManageFunctions
  }
  if (input.canEditScheduleSongs !== undefined) {
    membership.canEditScheduleSongs = input.canEditScheduleSongs
  }
}

export default class MemberService {
  async list(actor: Membership, term: string) {
    const query = Membership.query()
      .where('ministryId', actor.ministryId)
      .where('status', 'active')
      .preload('user')
      .preload('functions', (functions) => {
        functions.orderBy('sortOrder', 'asc')
      })

    if (term) {
      const safe = term.replaceAll('%', '').replaceAll('_', '')
      query.whereHas('user', (user) => {
        user.whereILike('name', `%${safe}%`)
      })
    }

    const members = await query
    return members.sort((left, right) => left.user.name.localeCompare(right.user.name, 'pt'))
  }

  async pending(actor: Membership) {
    new MembershipAccessService().assertAdmin(actor)

    const rows = await Membership.query()
      .where('ministryId', actor.ministryId)
      .where('status', 'pending')
      .preload('user')

    return rows.sort((left, right) => left.user.name.localeCompare(right.user.name, 'pt'))
  }

  async approve(actor: Membership, membershipId: string) {
    new MembershipAccessService().assertAdmin(actor)
    const request = await this.#pendingInMinistry(actor.ministryId, membershipId)
    request.status = 'active'
    await request.save()
    return request
  }

  async reject(actor: Membership, membershipId: string) {
    new MembershipAccessService().assertAdmin(actor)
    const request = await this.#pendingInMinistry(actor.ministryId, membershipId)
    await request.delete()
  }

  async cancel(userId: string, membershipId: string) {
    if (!isUuid(membershipId)) {
      throw new RequestNotFoundException()
    }

    const request = await Membership.query()
      .where('id', membershipId)
      .where('userId', userId)
      .where('status', 'pending')
      .first()

    if (!request) {
      throw new RequestNotFoundException()
    }

    await request.delete()
  }

  async updateAccess(actor: Membership, membershipId: string, input: FlagsInput) {
    new MembershipAccessService().assertAdmin(actor)

    if (!isUuid(membershipId)) {
      throw new RequestNotFoundException()
    }

    await db.transaction(async (trx) => {
      const target = await Membership.query({ client: trx })
        .where('id', membershipId)
        .where('ministryId', actor.ministryId)
        .where('status', 'active')
        .forUpdate()
        .first()

      if (!target) {
        throw new RequestNotFoundException()
      }

      const willBeAdmin = input.isAdmin ?? target.isAdmin
      const touchesFlags =
        input.canManageSchedules !== undefined ||
        input.canManageRepertoire !== undefined ||
        input.canManageFunctions !== undefined ||
        input.canEditScheduleSongs !== undefined

      if (willBeAdmin && touchesFlags) {
        throw new FieldException(
          'isAdmin',
          'As permissões de um administrador não podem ser alteradas.'
        )
      }

      if (target.isAdmin && input.isAdmin === false) {
        const admins = await new MembershipAccessService().lockAdmins(actor.ministryId, trx)
        if (admins.length <= 1) {
          throw new FieldException('isAdmin', 'O ministério precisa de um administrador.')
        }
      }

      if (input.isAdmin !== undefined) {
        target.isAdmin = input.isAdmin
        if (input.isAdmin) {
          target.canManageSchedules = true
          target.canManageRepertoire = true
          target.canManageFunctions = true
          target.canEditScheduleSongs = true
        }
      }

      if (!target.isAdmin) {
        applyFlags(target, input)
      }

      target.useTransaction(trx)
      await target.save()
    })
  }

  async assignFunctions(actor: Membership, membershipId: string, functionIds: string[]) {
    new MembershipAccessService().assertAdmin(actor)

    if (!isUuid(membershipId)) {
      throw new RequestNotFoundException()
    }

    const uniqueIds = [...new Set(functionIds)]
    const target = await Membership.query()
      .where('id', membershipId)
      .where('ministryId', actor.ministryId)
      .where('status', 'active')
      .preload('functions')
      .first()

    if (!target) {
      throw new RequestNotFoundException()
    }

    const functions =
      uniqueIds.length === 0
        ? []
        : await MinistryFunction.query()
            .where('ministryId', actor.ministryId)
            .whereIn('id', uniqueIds)

    if (functions.length !== uniqueIds.length) {
      throw new FieldException('functionIds', 'Esta função não pode ser atribuída.')
    }

    const currentIds = new Set(target.functions.map((item) => item.id))
    const blocked = functions.some((item) => item.archivedAt && !currentIds.has(item.id))
    if (blocked) {
      throw new FieldException('functionIds', 'Esta função não pode ser atribuída.')
    }

    await target.related('functions').sync(uniqueIds)
  }

  async #pendingInMinistry(ministryId: string, membershipId: string) {
    if (!isUuid(membershipId)) {
      throw new RequestNotFoundException()
    }

    const request = await Membership.query()
      .where('id', membershipId)
      .where('ministryId', ministryId)
      .where('status', 'pending')
      .first()

    if (!request) {
      throw new RequestNotFoundException()
    }

    return request
  }
}

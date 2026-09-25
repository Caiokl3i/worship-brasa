import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import Membership from '#models/membership'
import {
  ForbiddenActionException,
  MinistryNotFoundException,
} from '#exceptions/ministry_exceptions'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isUuid(value: string) {
  return UUID_PATTERN.test(value)
}

export default class MembershipAccessService {
  async getMembership(userId: string, ministryId: string) {
    if (!isUuid(ministryId)) {
      throw new MinistryNotFoundException()
    }

    const membership = await Membership.query()
      .where('userId', userId)
      .where('ministryId', ministryId)
      .where('status', 'active')
      .first()

    if (!membership) {
      throw new MinistryNotFoundException()
    }

    return membership
  }

  assertAdmin(membership: Membership) {
    if (!membership.isAdmin) {
      throw new ForbiddenActionException()
    }
  }

  assertCanManageFunctions(membership: Membership) {
    if (!membership.isAdmin && !membership.canManageFunctions) {
      throw new ForbiddenActionException()
    }
  }

  assertCanManageRepertoire(membership: Membership) {
    if (!membership.isAdmin && !membership.canManageRepertoire) {
      throw new ForbiddenActionException()
    }
  }

  managesSchedules(membership: Membership) {
    return membership.isAdmin || membership.canManageSchedules
  }

  editsScheduleSongs(membership: Membership) {
    return this.managesSchedules(membership) || membership.canEditScheduleSongs
  }

  assertCanManageSchedules(membership: Membership) {
    if (!this.managesSchedules(membership)) {
      throw new ForbiddenActionException()
    }
  }

  async lockAdmins(ministryId: string, trx: TransactionClientContract) {
    return Membership.query({ client: trx })
      .where('ministryId', ministryId)
      .where('status', 'active')
      .where('isAdmin', true)
      .forUpdate()
  }
}

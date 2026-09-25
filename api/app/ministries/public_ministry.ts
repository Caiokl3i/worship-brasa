import { DateTime } from 'luxon'
import type Invite from '#models/invite'
import type Membership from '#models/membership'
import type Ministry from '#models/ministry'
import type MinistryFunction from '#models/ministry_function'

export function toPublicMinistry(ministry: Ministry) {
  return {
    id: ministry.id,
    name: ministry.name,
    timezone: ministry.timezone,
    color: ministry.color,
    musicModuleEnabled: ministry.musicModuleEnabled,
  }
}

export function toMembershipAccess(membership: Membership) {
  return {
    id: membership.id,
    isAdmin: membership.isAdmin,
    canManageSchedules: membership.canManageSchedules,
    canManageRepertoire: membership.canManageRepertoire,
    canManageFunctions: membership.canManageFunctions,
    canEditScheduleSongs: membership.canEditScheduleSongs,
  }
}

export function toFunctionSummary(ministryFunction: MinistryFunction) {
  return {
    id: ministryFunction.id,
    name: ministryFunction.name,
    sortOrder: ministryFunction.sortOrder,
    archived: ministryFunction.archivedAt !== null,
  }
}

export function toMember(membership: Membership, includeFlags: boolean) {
  return {
    membershipId: membership.id,
    name: membership.user.name,
    isAdmin: membership.isAdmin,
    functions: membership.functions.map((item) => ({
      id: item.id,
      name: item.name,
      archived: item.archivedAt !== null,
    })),
    ...(includeFlags
      ? {
          canManageSchedules: membership.canManageSchedules,
          canManageRepertoire: membership.canManageRepertoire,
          canManageFunctions: membership.canManageFunctions,
          canEditScheduleSongs: membership.canEditScheduleSongs,
        }
      : {}),
  }
}

export function toInvite(invite: Invite) {
  return {
    code: invite.code,
    expiresAt: invite.expiresAt.toISO(),
    expired: invite.expiresAt.toUTC() <= DateTime.utc(),
    path: `/convite/${invite.code}`,
  }
}

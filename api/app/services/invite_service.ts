import { randomInt } from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Invite from '#models/invite'
import Membership from '#models/membership'
import type { MembershipStatus } from '#models/membership'
import MembershipAccessService from '#services/membership_access_service'
import { FieldException } from '#exceptions/ministry_exceptions'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const INVITE_DAYS = 7

function makeCode() {
  return Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
}

function isUniqueViolation(error: unknown) {
  const candidate = error as { code?: string; cause?: { code?: string } }
  return candidate.code === '23505' || candidate.cause?.code === '23505'
}

function clearFlags(membership: Membership) {
  membership.isAdmin = false
  membership.canManageSchedules = false
  membership.canManageRepertoire = false
  membership.canManageFunctions = false
  membership.canEditScheduleSongs = false
}

export default class InviteService {
  async current(actor: Membership) {
    new MembershipAccessService().assertAdmin(actor)

    const invite = await Invite.query()
      .where('ministryId', actor.ministryId)
      .whereNull('revokedAt')
      .orderBy('createdAt', 'desc')
      .first()

    return invite
  }

  async generate(actor: Membership) {
    new MembershipAccessService().assertAdmin(actor)

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await db.transaction(async (trx) => {
          await Invite.query({ client: trx })
            .where('ministryId', actor.ministryId)
            .whereNull('revokedAt')
            .update({ revokedAt: DateTime.utc() })

          return Invite.create(
            {
              ministryId: actor.ministryId,
              code: makeCode(),
              createdByUserId: actor.userId,
              expiresAt: DateTime.utc().plus({ days: INVITE_DAYS }),
            },
            { client: trx }
          )
        })
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === 4) {
          throw error
        }
      }
    }

    throw new FieldException('code', 'Não foi possível gerar o código.')
  }

  async enter(userId: string, code: string) {
    const invite = await Invite.query()
      .where('code', code)
      .whereNull('revokedAt')
      .where('expiresAt', '>', DateTime.utc().toSQL()!)
      .preload('ministry')
      .first()

    if (!invite) {
      throw new FieldException('code', 'Código inválido ou vencido.')
    }

    const existing = await Membership.query()
      .where('userId', userId)
      .where('ministryId', invite.ministryId)
      .first()

    if (existing?.status === 'active') {
      throw new FieldException('code', 'Você já participa deste ministério.')
    }

    if (existing?.status === 'pending') {
      return { membership: existing, ministryName: invite.ministry.name, created: false }
    }

    if (existing) {
      existing.status = 'pending' satisfies MembershipStatus
      clearFlags(existing)
      await existing.save()
      return { membership: existing, ministryName: invite.ministry.name, created: false }
    }

    const membership = await Membership.create({
      userId,
      ministryId: invite.ministryId,
      status: 'pending',
      isAdmin: false,
      canManageSchedules: false,
      canManageRepertoire: false,
      canManageFunctions: false,
      canEditScheduleSongs: false,
    })

    return { membership, ministryName: invite.ministry.name, created: true }
  }
}

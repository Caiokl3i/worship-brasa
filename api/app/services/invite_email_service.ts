import { randomInt } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import EmailInvite from '#models/email_invite'
import Membership from '#models/membership'
import User from '#models/user'
import { FieldException } from '#exceptions/ministry_exceptions'
import InviteService from '#services/invite_service'
import { getInviteMailer } from '#services/invite_mailer'
import MembershipAccessService from '#services/membership_access_service'
import NotificationService from '#services/notification_service'

const CODE_MINUTES = 30

export default class InviteEmailService {
  async send(actor: Membership, email: string) {
    new MembershipAccessService().assertAdmin(actor)
    const normalized = email.trim().toLowerCase()
    const user = await User.findBy('email', normalized)

    if (user) {
      const membership = await Membership.query()
        .where('userId', user.id)
        .where('ministryId', actor.ministryId)
        .first()
      if (membership?.status === 'active') {
        throw new FieldException('email', 'Esta pessoa já participa deste ministério.')
      }

      const invite = await this.#activeCode(actor)
      await getInviteMailer().send(normalized, invite.code)
      return { sent: 'code' as const }
    }

    await EmailInvite.query()
      .where('ministryId', actor.ministryId)
      .where('email', normalized)
      .whereNull('usedAt')
      .update({ usedAt: DateTime.utc() })

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0')
    await EmailInvite.create({
      ministryId: actor.ministryId,
      email: normalized,
      codeHash: await hash.make(code),
      expiresAt: DateTime.utc().plus({ minutes: CODE_MINUTES }),
      createdByUserId: actor.userId,
    })
    await getInviteMailer().send(normalized, code)
    return { sent: 'activation' as const }
  }

  /**
   * Conta que passou a existir não tem a senha trocada.
   * Código errado não cria usuário.
   */
  async activate(email: string, code: string, name: string, password: string) {
    const normalized = email.trim().toLowerCase()
    if (await User.findBy('email', normalized)) {
      return false
    }

    const invite = await EmailInvite.query()
      .where('email', normalized)
      .whereNull('usedAt')
      .where('expiresAt', '>', DateTime.utc().toSQL()!)
      .orderBy('createdAt', 'desc')
      .first()

    if (!invite) {
      return false
    }

    const matches = await hash.verify(invite.codeHash, code)
    if (!matches) {
      return false
    }

    let userId = ''
    try {
      userId = await db.transaction(async (trx) => {
        const user = await User.create(
          {
            name,
            email: normalized,
            password,
            authVersion: 1,
          },
          { client: trx }
        )
        await Membership.create(
          {
            userId: user.id,
            ministryId: invite.ministryId,
            status: 'pending',
            isAdmin: false,
            canManageSchedules: false,
            canManageRepertoire: false,
            canManageFunctions: false,
            canEditScheduleSongs: false,
          },
          { client: trx }
        )
        invite.useTransaction(trx)
        invite.usedAt = DateTime.utc()
        await invite.save()
        return user.id
      })
    } catch (error) {
      const candidate = error as { code?: string; cause?: { code?: string } }
      if (candidate.code === '23505' || candidate.cause?.code === '23505') {
        return false
      }
      throw error
    }

    const user = await User.findOrFail(userId)
    await new NotificationService().notifyJoinRequested(invite.ministryId, user.name)
    return true
  }

  async #activeCode(actor: Membership) {
    const invites = new InviteService()
    const current = await invites.current(actor)
    if (current && current.expiresAt > DateTime.utc()) {
      return current
    }
    return invites.generate(actor)
  }
}

import { randomInt } from 'node:crypto'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import PasswordReset from '#models/password_reset'
import { getPasswordResetMailer } from '#services/password_reset_mailer'

const CODE_MINUTES = 30

export default class PasswordResetService {
  /**
   * E-mail que não existe termina em silêncio.
   * A rota responde a mesma frase nos dois casos.
   */
  async requestCode(email: string) {
    const user = await User.findBy('email', email)
    if (!user) {
      return
    }

    await PasswordReset.query()
      .where('userId', user.id)
      .whereNull('usedAt')
      .update({ usedAt: DateTime.utc() })

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0')

    await PasswordReset.create({
      userId: user.id,
      codeHash: await hash.make(code),
      expiresAt: DateTime.utc().plus({ minutes: CODE_MINUTES }),
    })

    await getPasswordResetMailer().sendCode(user.email, code)
  }

  /**
   * Código errado, vencido ou já usado devolve false.
   * Código errado não gasta o verdadeiro: usedAt só muda depois do hash conferir.
   */
  async confirmCode(email: string, code: string, password: string) {
    const user = await User.findBy('email', email)
    if (!user) {
      return false
    }

    const reset = await PasswordReset.query()
      .where('userId', user.id)
      .whereNull('usedAt')
      .where('expiresAt', '>', DateTime.utc().toSQL()!)
      .orderBy('createdAt', 'desc')
      .first()

    if (!reset) {
      return false
    }

    const matches = await hash.verify(reset.codeHash, code)
    if (!matches) {
      return false
    }

    await db.transaction(async (trx) => {
      reset.useTransaction(trx)
      user.useTransaction(trx)

      reset.usedAt = DateTime.utc()
      user.password = password
      user.authVersion += 1

      await reset.save()
      await user.save()
    })

    return true
  }
}

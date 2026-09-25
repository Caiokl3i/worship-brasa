import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import Ministry from '#models/ministry'
import { MinistryNotFoundException } from '#exceptions/ministry_exceptions'

export default class RepertoireModuleMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const ministry = await Ministry.find(ctx.membership.ministryId)

    if (!ministry || !ministry.musicModuleEnabled) {
      throw new MinistryNotFoundException()
    }

    return next()
  }
}

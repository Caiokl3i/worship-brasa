import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type Membership from '#models/membership'
import MembershipAccessService from '#services/membership_access_service'

declare module '@adonisjs/core/http' {
  export interface HttpContext {
    membership: Membership
  }
}

export default class MinistryAccessMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.getUserOrFail()
    ctx.membership = await new MembershipAccessService().getMembership(
      user.id,
      ctx.params.ministryId
    )

    return next()
  }
}

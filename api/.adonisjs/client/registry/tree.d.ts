/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  health: {
    show: typeof routes['health.show']
  }
  account: {
    store: typeof routes['account.store']
  }
  session: {
    store: typeof routes['session.store']
    destroy: typeof routes['session.destroy']
  }
  passwordReset: {
    store: typeof routes['password_reset.store']
    update: typeof routes['password_reset.update']
  }
  profile: {
    show: typeof routes['profile.show']
    update: typeof routes['profile.update']
    updatePassword: typeof routes['profile.update_password']
  }
}

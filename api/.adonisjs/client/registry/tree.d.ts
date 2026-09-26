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
  ministries: {
    index: typeof routes['ministries.index']
    store: typeof routes['ministries.store']
    show: typeof routes['ministries.show']
    update: typeof routes['ministries.update']
    leave: typeof routes['ministries.leave']
  }
  invites: {
    enter: typeof routes['invites.enter']
    show: typeof routes['invites.show']
    store: typeof routes['invites.store']
  }
  members: {
    cancel: typeof routes['members.cancel']
    index: typeof routes['members.index']
    pending: typeof routes['members.pending']
    approve: typeof routes['members.approve']
    reject: typeof routes['members.reject']
    update: typeof routes['members.update']
    assignFunctions: typeof routes['members.assign_functions']
  }
  ministryFunctions: {
    index: typeof routes['ministry_functions.index']
    store: typeof routes['ministry_functions.store']
    reorder: typeof routes['ministry_functions.reorder']
    update: typeof routes['ministry_functions.update']
    archive: typeof routes['ministry_functions.archive']
  }
  songs: {
    index: typeof routes['songs.index']
    store: typeof routes['songs.store']
    show: typeof routes['songs.show']
    update: typeof routes['songs.update']
    destroy: typeof routes['songs.destroy']
  }
  folders: {
    index: typeof routes['folders.index']
    store: typeof routes['folders.store']
    update: typeof routes['folders.update']
    destroy: typeof routes['folders.destroy']
  }
  classifications: {
    index: typeof routes['classifications.index']
    store: typeof routes['classifications.store']
    archive: typeof routes['classifications.archive']
  }
  schedules: {
    index: typeof routes['schedules.index']
    store: typeof routes['schedules.store']
    show: typeof routes['schedules.show']
    update: typeof routes['schedules.update']
    destroy: typeof routes['schedules.destroy']
    publish: typeof routes['schedules.publish']
    unpublish: typeof routes['schedules.unpublish']
    confirm: typeof routes['schedules.confirm']
    absence: typeof routes['schedules.absence']
    removeUnavailable: typeof routes['schedules.remove_unavailable']
    conflicts: typeof routes['schedules.conflicts']
  }
  unavailabilities: {
    index: typeof routes['unavailabilities.index']
    store: typeof routes['unavailabilities.store']
    update: typeof routes['unavailabilities.update']
    destroy: typeof routes['unavailabilities.destroy']
  }
}

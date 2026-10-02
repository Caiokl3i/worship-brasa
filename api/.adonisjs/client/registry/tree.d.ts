/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  health: {
    show: typeof routes['health.show']
  }
  profile: {
    show: typeof routes['profile.show']
    update: typeof routes['profile.update']
    updatePassword: typeof routes['profile.update_password']
    destroy: typeof routes['profile.destroy']
  }
  account: {
    store: typeof routes['account.store']
  }
  session: {
    store: typeof routes['session.store']
    google: typeof routes['session.google']
    googleCallback: typeof routes['session.google_callback']
    destroy: typeof routes['session.destroy']
  }
  passwordReset: {
    store: typeof routes['password_reset.store']
    update: typeof routes['password_reset.update']
  }
  invites: {
    activate: typeof routes['invites.activate']
    enter: typeof routes['invites.enter']
    show: typeof routes['invites.show']
    store: typeof routes['invites.store']
    email: typeof routes['invites.email']
  }
  integrations: {
    index: typeof routes['integrations.index']
    show: typeof routes['integrations.show']
    current: typeof routes['integrations.current']
    store: typeof routes['integrations.store']
    destroy: typeof routes['integrations.destroy']
  }
  calendars: {
    show: typeof routes['calendars.show']
    store: typeof routes['calendars.store']
    callback: typeof routes['calendars.callback']
    destroy: typeof routes['calendars.destroy']
  }
  notifications: {
    index: typeof routes['notifications.index']
    read: typeof routes['notifications.read']
    preferences: typeof routes['notifications.preferences']
    updatePreferences: typeof routes['notifications.update_preferences']
  }
  ministries: {
    index: typeof routes['ministries.index']
    store: typeof routes['ministries.store']
    show: typeof routes['ministries.show']
    update: typeof routes['ministries.update']
    leave: typeof routes['ministries.leave']
  }
  members: {
    cancel: typeof routes['members.cancel']
    index: typeof routes['members.index']
    pending: typeof routes['members.pending']
    approve: typeof routes['members.approve']
    reject: typeof routes['members.reject']
    update: typeof routes['members.update']
    assignFunctions: typeof routes['members.assign_functions']
    remove: typeof routes['members.remove']
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
    trash: typeof routes['songs.trash']
    restore: typeof routes['songs.restore']
  }
  spreadsheets: {
    template: typeof routes['spreadsheets.template']
    preview: typeof routes['spreadsheets.preview']
    import: typeof routes['spreadsheets.import']
    export: typeof routes['spreadsheets.export']
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
    trash: typeof routes['schedules.trash']
    restore: typeof routes['schedules.restore']
    index: typeof routes['schedules.index']
    store: typeof routes['schedules.store']
    show: typeof routes['schedules.show']
    update: typeof routes['schedules.update']
    destroy: typeof routes['schedules.destroy']
    destroyScoped: typeof routes['schedules.destroy_scoped']
    materialize: typeof routes['schedules.materialize']
    publish: typeof routes['schedules.publish']
    unpublish: typeof routes['schedules.unpublish']
    confirm: typeof routes['schedules.confirm']
    absence: typeof routes['schedules.absence']
    removeUnavailable: typeof routes['schedules.remove_unavailable']
    conflicts: typeof routes['schedules.conflicts']
  }
  scripts: {
    save: typeof routes['scripts.save']
    apply: typeof routes['scripts.apply']
    index: typeof routes['scripts.index']
    store: typeof routes['scripts.store']
    update: typeof routes['scripts.update']
  }
  generations: {
    show: typeof routes['generations.show']
    update: typeof routes['generations.update']
    suggest: typeof routes['generations.suggest']
  }
  shares: {
    text: typeof routes['shares.text']
    image: typeof routes['shares.image']
  }
  reports: {
    overview: typeof routes['reports.overview']
    show: typeof routes['reports.show']
    panorama: typeof routes['reports.panorama']
  }
  notices: {
    index: typeof routes['notices.index']
    store: typeof routes['notices.store']
    update: typeof routes['notices.update']
    archive: typeof routes['notices.archive']
    unarchive: typeof routes['notices.unarchive']
  }
  chats: {
    ministry: typeof routes['chats.ministry']
    sendMinistry: typeof routes['chats.send_ministry']
    schedule: typeof routes['chats.schedule']
    sendSchedule: typeof routes['chats.send_schedule']
  }
  unavailabilities: {
    index: typeof routes['unavailabilities.index']
    store: typeof routes['unavailabilities.store']
    update: typeof routes['unavailabilities.update']
    destroy: typeof routes['unavailabilities.destroy']
  }
}

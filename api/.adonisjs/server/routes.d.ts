import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health.show': { paramsTuple?: []; params?: {} }
    'account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password_reset.store': { paramsTuple?: []; params?: {} }
    'password_reset.update': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'profile.update': { paramsTuple?: []; params?: {} }
    'profile.update_password': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'ministries.index': { paramsTuple?: []; params?: {} }
    'ministries.store': { paramsTuple?: []; params?: {} }
    'invites.enter': { paramsTuple?: []; params?: {} }
    'members.cancel': { paramsTuple: [ParamValue]; params: {'membershipId': ParamValue} }
    'ministries.show': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'ministries.update': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'ministries.leave': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'invites.show': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'invites.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'members.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'members.pending': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'members.approve': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'membershipId': ParamValue} }
    'members.reject': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'membershipId': ParamValue} }
    'members.update': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'membershipId': ParamValue} }
    'members.assign_functions': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'membershipId': ParamValue} }
    'ministry_functions.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'ministry_functions.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'ministry_functions.reorder': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'ministry_functions.update': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'functionId': ParamValue} }
    'ministry_functions.archive': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'functionId': ParamValue} }
    'songs.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'songs.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'songs.show': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'songId': ParamValue} }
    'songs.update': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'songId': ParamValue} }
    'songs.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'songId': ParamValue} }
    'folders.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'folders.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'folders.update': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'folderId': ParamValue} }
    'folders.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'folderId': ParamValue} }
    'classifications.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'classifications.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'classifications.archive': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'classificationId': ParamValue} }
  }
  GET: {
    'health.show': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'ministries.index': { paramsTuple?: []; params?: {} }
    'ministries.show': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'invites.show': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'members.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'members.pending': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'ministry_functions.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'songs.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'songs.show': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'songId': ParamValue} }
    'folders.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'classifications.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
  }
  HEAD: {
    'health.show': { paramsTuple?: []; params?: {} }
    'profile.show': { paramsTuple?: []; params?: {} }
    'ministries.index': { paramsTuple?: []; params?: {} }
    'ministries.show': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'invites.show': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'members.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'members.pending': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'ministry_functions.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'songs.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'songs.show': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'songId': ParamValue} }
    'folders.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'classifications.index': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
  }
  POST: {
    'account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'password_reset.store': { paramsTuple?: []; params?: {} }
    'password_reset.update': { paramsTuple?: []; params?: {} }
    'profile.update_password': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'ministries.store': { paramsTuple?: []; params?: {} }
    'invites.enter': { paramsTuple?: []; params?: {} }
    'ministries.leave': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'invites.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'members.approve': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'membershipId': ParamValue} }
    'members.reject': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'membershipId': ParamValue} }
    'ministry_functions.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'ministry_functions.reorder': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'ministry_functions.archive': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'functionId': ParamValue} }
    'songs.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'folders.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'classifications.store': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'classifications.archive': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'classificationId': ParamValue} }
  }
  PATCH: {
    'profile.update': { paramsTuple?: []; params?: {} }
    'ministries.update': { paramsTuple: [ParamValue]; params: {'ministryId': ParamValue} }
    'members.update': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'membershipId': ParamValue} }
    'ministry_functions.update': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'functionId': ParamValue} }
    'songs.update': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'songId': ParamValue} }
    'folders.update': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'folderId': ParamValue} }
  }
  DELETE: {
    'members.cancel': { paramsTuple: [ParamValue]; params: {'membershipId': ParamValue} }
    'songs.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'songId': ParamValue} }
    'folders.destroy': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'folderId': ParamValue} }
  }
  PUT: {
    'members.assign_functions': { paramsTuple: [ParamValue,ParamValue]; params: {'ministryId': ParamValue,'membershipId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}
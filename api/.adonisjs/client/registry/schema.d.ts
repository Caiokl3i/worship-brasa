/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'health.show': {
    methods: ["GET","HEAD"]
    pattern: '/health'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/health_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/health_controller').default['show']>>>
    }
  }
  'account.store': {
    methods: ["POST"]
    pattern: '/api/cadastrar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').registerValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').registerValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/account_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/account_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.store': {
    methods: ["POST"]
    pattern: '/api/entrar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').loginValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').loginValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password_reset.store': {
    methods: ["POST"]
    pattern: '/api/recuperar-senha'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').requestResetValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').requestResetValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'password_reset.update': {
    methods: ["POST"]
    pattern: '/api/recuperar-senha/confirmar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').confirmResetValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').confirmResetValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/password_reset_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/eu'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['show']>>>
    }
  }
  'profile.update': {
    methods: ["PATCH"]
    pattern: '/api/perfil'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').updateProfileValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').updateProfileValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'profile.update_password': {
    methods: ["POST"]
    pattern: '/api/perfil/senha'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/user').changePasswordValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/user').changePasswordValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['updatePassword']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/profile_controller').default['updatePassword']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'session.destroy': {
    methods: ["POST"]
    pattern: '/api/sair'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/session_controller').default['destroy']>>>
    }
  }
  'ministries.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['index']>>>
    }
  }
  'ministries.store': {
    methods: ["POST"]
    pattern: '/api/ministerios'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ministry').createMinistryValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/ministry').createMinistryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'invites.enter': {
    methods: ["POST"]
    pattern: '/api/convites/entrar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ministry').enterInviteValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/ministry').enterInviteValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invites_controller').default['enter']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invites_controller').default['enter']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'members.cancel': {
    methods: ["DELETE"]
    pattern: '/api/pedidos/:membershipId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { membershipId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['cancel']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/members_controller').default['cancel']>>>
    }
  }
  'ministries.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['show']>>>
    }
  }
  'ministries.update': {
    methods: ["PATCH"]
    pattern: '/api/ministerios/:ministryId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ministry').updateMinistryValidator)>>
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ministry').updateMinistryValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ministries.leave': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/sair'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['leave']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministries_controller').default['leave']>>>
    }
  }
  'invites.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/convite'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invites_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invites_controller').default['show']>>>
    }
  }
  'invites.store': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/convite'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/invites_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/invites_controller').default['store']>>>
    }
  }
  'members.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/membros'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/members_controller').default['index']>>>
    }
  }
  'members.pending': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/pedidos'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['pending']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/members_controller').default['pending']>>>
    }
  }
  'members.approve': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/pedidos/:membershipId/aprovar'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; membershipId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['approve']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/members_controller').default['approve']>>>
    }
  }
  'members.reject': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/pedidos/:membershipId/rejeitar'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; membershipId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['reject']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/members_controller').default['reject']>>>
    }
  }
  'members.update': {
    methods: ["PATCH"]
    pattern: '/api/ministerios/:ministryId/membros/:membershipId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ministry').updateMemberValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; membershipId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ministry').updateMemberValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/members_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'members.assign_functions': {
    methods: ["PUT"]
    pattern: '/api/ministerios/:ministryId/membros/:membershipId/funcoes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ministry').assignFunctionsValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; membershipId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ministry').assignFunctionsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/members_controller').default['assignFunctions']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/members_controller').default['assignFunctions']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ministry_functions.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/funcoes'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['index']>>>
    }
  }
  'ministry_functions.store': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/funcoes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ministry').createFunctionValidator)>>
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ministry').createFunctionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ministry_functions.reorder': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/funcoes/ordem'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ministry').reorderFunctionsValidator)>>
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ministry').reorderFunctionsValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['reorder']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['reorder']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ministry_functions.update': {
    methods: ["PATCH"]
    pattern: '/api/ministerios/:ministryId/funcoes/:functionId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/ministry').renameFunctionValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; functionId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/ministry').renameFunctionValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'ministry_functions.archive': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/funcoes/:functionId/arquivar'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; functionId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['archive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ministry_functions_controller').default['archive']>>>
    }
  }
  'songs.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/musicas'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['index']>>>
    }
  }
  'songs.store': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/musicas'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/repertoire').saveSongValidator)>>
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/repertoire').saveSongValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'songs.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/musicas/:songId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; songId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['show']>>>
    }
  }
  'songs.update': {
    methods: ["PATCH"]
    pattern: '/api/ministerios/:ministryId/musicas/:songId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/repertoire').saveSongValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; songId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/repertoire').saveSongValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'songs.destroy': {
    methods: ["DELETE"]
    pattern: '/api/ministerios/:ministryId/musicas/:songId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; songId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/songs_controller').default['destroy']>>>
    }
  }
  'folders.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/pastas'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['index']>>>
    }
  }
  'folders.store': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/pastas'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/repertoire').createFolderValidator)>>
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/repertoire').createFolderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'folders.update': {
    methods: ["PATCH"]
    pattern: '/api/ministerios/:ministryId/pastas/:folderId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/repertoire').renameFolderValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; folderId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/repertoire').renameFolderValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'folders.destroy': {
    methods: ["DELETE"]
    pattern: '/api/ministerios/:ministryId/pastas/:folderId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; folderId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/folders_controller').default['destroy']>>>
    }
  }
  'classifications.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/classificacoes'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/classifications_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/classifications_controller').default['index']>>>
    }
  }
  'classifications.store': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/classificacoes'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/repertoire').createClassificationValidator)>>
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/repertoire').createClassificationValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/classifications_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/classifications_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'classifications.archive': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/classificacoes/:classificationId/arquivar'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; classificationId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/classifications_controller').default['archive']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/classifications_controller').default['archive']>>>
    }
  }
  'schedules.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/escalas'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['index']>>>
    }
  }
  'schedules.store': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/escalas'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').createScheduleValidator)>>
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').createScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'schedules.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; scheduleId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['show']>>>
    }
  }
  'schedules.update': {
    methods: ["PATCH"]
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').saveScheduleValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; scheduleId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').saveScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'schedules.destroy': {
    methods: ["DELETE"]
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; scheduleId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['destroy']>>>
    }
  }
  'schedules.destroy_scoped': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId/excluir'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').deleteScheduleValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; scheduleId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').deleteScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['destroyScoped']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['destroyScoped']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'schedules.materialize': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/series/:seriesId/materializar'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; seriesId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['materialize']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['materialize']>>>
    }
  }
  'schedules.publish': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId/publicar'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').saveScheduleValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; scheduleId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').saveScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['publish']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['publish']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'schedules.unpublish': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId/rascunho'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').saveScheduleValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; scheduleId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').saveScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['unpublish']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['unpublish']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'schedules.confirm': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId/confirmacao'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').confirmScheduleValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; scheduleId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').confirmScheduleValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['confirm']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['confirm']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'schedules.absence': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId/falta'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').absenceValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; scheduleId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').absenceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['absence']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['absence']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'schedules.remove_unavailable': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId/remover-indisponiveis'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').removeUnavailableValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; scheduleId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').removeUnavailableValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['removeUnavailable']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['removeUnavailable']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'schedules.conflicts': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/conflitos'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').conflictCheckValidator)>>
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').conflictCheckValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['conflicts']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/schedules_controller').default['conflicts']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'unavailabilities.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/ministerios/:ministryId/indisponibilidades'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/unavailabilities_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/unavailabilities_controller').default['index']>>>
    }
  }
  'unavailabilities.store': {
    methods: ["POST"]
    pattern: '/api/ministerios/:ministryId/indisponibilidades'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').saveUnavailabilityValidator)>>
      paramsTuple: [ParamValue]
      params: { ministryId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').saveUnavailabilityValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/unavailabilities_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/unavailabilities_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'unavailabilities.update': {
    methods: ["PATCH"]
    pattern: '/api/ministerios/:ministryId/indisponibilidades/:unavailabilityId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/schedule').saveUnavailabilityValidator)>>
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; unavailabilityId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/schedule').saveUnavailabilityValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/unavailabilities_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/unavailabilities_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'unavailabilities.destroy': {
    methods: ["DELETE"]
    pattern: '/api/ministerios/:ministryId/indisponibilidades/:unavailabilityId'
    types: {
      body: {}
      paramsTuple: [ParamValue, ParamValue]
      params: { ministryId: ParamValue; unavailabilityId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/unavailabilities_controller').default['destroy']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/unavailabilities_controller').default['destroy']>>>
    }
  }
}

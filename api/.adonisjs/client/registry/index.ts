/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'health.show': {
    methods: ["GET","HEAD"],
    pattern: '/health',
    tokens: [{"old":"/health","type":0,"val":"health","end":""}],
    types: placeholder as Registry['health.show']['types'],
  },
  'account.store': {
    methods: ["POST"],
    pattern: '/api/cadastrar',
    tokens: [{"old":"/api/cadastrar","type":0,"val":"api","end":""},{"old":"/api/cadastrar","type":0,"val":"cadastrar","end":""}],
    types: placeholder as Registry['account.store']['types'],
  },
  'session.store': {
    methods: ["POST"],
    pattern: '/api/entrar',
    tokens: [{"old":"/api/entrar","type":0,"val":"api","end":""},{"old":"/api/entrar","type":0,"val":"entrar","end":""}],
    types: placeholder as Registry['session.store']['types'],
  },
  'password_reset.store': {
    methods: ["POST"],
    pattern: '/api/recuperar-senha',
    tokens: [{"old":"/api/recuperar-senha","type":0,"val":"api","end":""},{"old":"/api/recuperar-senha","type":0,"val":"recuperar-senha","end":""}],
    types: placeholder as Registry['password_reset.store']['types'],
  },
  'password_reset.update': {
    methods: ["POST"],
    pattern: '/api/recuperar-senha/confirmar',
    tokens: [{"old":"/api/recuperar-senha/confirmar","type":0,"val":"api","end":""},{"old":"/api/recuperar-senha/confirmar","type":0,"val":"recuperar-senha","end":""},{"old":"/api/recuperar-senha/confirmar","type":0,"val":"confirmar","end":""}],
    types: placeholder as Registry['password_reset.update']['types'],
  },
  'profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/eu',
    tokens: [{"old":"/api/eu","type":0,"val":"api","end":""},{"old":"/api/eu","type":0,"val":"eu","end":""}],
    types: placeholder as Registry['profile.show']['types'],
  },
  'profile.update': {
    methods: ["PATCH"],
    pattern: '/api/perfil',
    tokens: [{"old":"/api/perfil","type":0,"val":"api","end":""},{"old":"/api/perfil","type":0,"val":"perfil","end":""}],
    types: placeholder as Registry['profile.update']['types'],
  },
  'profile.update_password': {
    methods: ["POST"],
    pattern: '/api/perfil/senha',
    tokens: [{"old":"/api/perfil/senha","type":0,"val":"api","end":""},{"old":"/api/perfil/senha","type":0,"val":"perfil","end":""},{"old":"/api/perfil/senha","type":0,"val":"senha","end":""}],
    types: placeholder as Registry['profile.update_password']['types'],
  },
  'session.destroy': {
    methods: ["POST"],
    pattern: '/api/sair',
    tokens: [{"old":"/api/sair","type":0,"val":"api","end":""},{"old":"/api/sair","type":0,"val":"sair","end":""}],
    types: placeholder as Registry['session.destroy']['types'],
  },
  'ministries.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios',
    tokens: [{"old":"/api/ministerios","type":0,"val":"api","end":""},{"old":"/api/ministerios","type":0,"val":"ministerios","end":""}],
    types: placeholder as Registry['ministries.index']['types'],
  },
  'ministries.store': {
    methods: ["POST"],
    pattern: '/api/ministerios',
    tokens: [{"old":"/api/ministerios","type":0,"val":"api","end":""},{"old":"/api/ministerios","type":0,"val":"ministerios","end":""}],
    types: placeholder as Registry['ministries.store']['types'],
  },
  'invites.enter': {
    methods: ["POST"],
    pattern: '/api/convites/entrar',
    tokens: [{"old":"/api/convites/entrar","type":0,"val":"api","end":""},{"old":"/api/convites/entrar","type":0,"val":"convites","end":""},{"old":"/api/convites/entrar","type":0,"val":"entrar","end":""}],
    types: placeholder as Registry['invites.enter']['types'],
  },
  'members.cancel': {
    methods: ["DELETE"],
    pattern: '/api/pedidos/:membershipId',
    tokens: [{"old":"/api/pedidos/:membershipId","type":0,"val":"api","end":""},{"old":"/api/pedidos/:membershipId","type":0,"val":"pedidos","end":""},{"old":"/api/pedidos/:membershipId","type":1,"val":"membershipId","end":""}],
    types: placeholder as Registry['members.cancel']['types'],
  },
  'ministries.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId',
    tokens: [{"old":"/api/ministerios/:ministryId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId","type":1,"val":"ministryId","end":""}],
    types: placeholder as Registry['ministries.show']['types'],
  },
  'ministries.update': {
    methods: ["PATCH"],
    pattern: '/api/ministerios/:ministryId',
    tokens: [{"old":"/api/ministerios/:ministryId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId","type":1,"val":"ministryId","end":""}],
    types: placeholder as Registry['ministries.update']['types'],
  },
  'ministries.leave': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/sair',
    tokens: [{"old":"/api/ministerios/:ministryId/sair","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/sair","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/sair","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/sair","type":0,"val":"sair","end":""}],
    types: placeholder as Registry['ministries.leave']['types'],
  },
  'invites.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/convite',
    tokens: [{"old":"/api/ministerios/:ministryId/convite","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/convite","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/convite","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/convite","type":0,"val":"convite","end":""}],
    types: placeholder as Registry['invites.show']['types'],
  },
  'invites.store': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/convite',
    tokens: [{"old":"/api/ministerios/:ministryId/convite","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/convite","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/convite","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/convite","type":0,"val":"convite","end":""}],
    types: placeholder as Registry['invites.store']['types'],
  },
  'members.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/membros',
    tokens: [{"old":"/api/ministerios/:ministryId/membros","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/membros","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/membros","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/membros","type":0,"val":"membros","end":""}],
    types: placeholder as Registry['members.index']['types'],
  },
  'members.pending': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/pedidos',
    tokens: [{"old":"/api/ministerios/:ministryId/pedidos","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/pedidos","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/pedidos","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/pedidos","type":0,"val":"pedidos","end":""}],
    types: placeholder as Registry['members.pending']['types'],
  },
  'members.approve': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/pedidos/:membershipId/aprovar',
    tokens: [{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/aprovar","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/aprovar","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/aprovar","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/aprovar","type":0,"val":"pedidos","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/aprovar","type":1,"val":"membershipId","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/aprovar","type":0,"val":"aprovar","end":""}],
    types: placeholder as Registry['members.approve']['types'],
  },
  'members.reject': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/pedidos/:membershipId/rejeitar',
    tokens: [{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/rejeitar","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/rejeitar","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/rejeitar","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/rejeitar","type":0,"val":"pedidos","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/rejeitar","type":1,"val":"membershipId","end":""},{"old":"/api/ministerios/:ministryId/pedidos/:membershipId/rejeitar","type":0,"val":"rejeitar","end":""}],
    types: placeholder as Registry['members.reject']['types'],
  },
  'members.update': {
    methods: ["PATCH"],
    pattern: '/api/ministerios/:ministryId/membros/:membershipId',
    tokens: [{"old":"/api/ministerios/:ministryId/membros/:membershipId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/membros/:membershipId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/membros/:membershipId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/membros/:membershipId","type":0,"val":"membros","end":""},{"old":"/api/ministerios/:ministryId/membros/:membershipId","type":1,"val":"membershipId","end":""}],
    types: placeholder as Registry['members.update']['types'],
  },
  'members.assign_functions': {
    methods: ["PUT"],
    pattern: '/api/ministerios/:ministryId/membros/:membershipId/funcoes',
    tokens: [{"old":"/api/ministerios/:ministryId/membros/:membershipId/funcoes","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/membros/:membershipId/funcoes","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/membros/:membershipId/funcoes","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/membros/:membershipId/funcoes","type":0,"val":"membros","end":""},{"old":"/api/ministerios/:ministryId/membros/:membershipId/funcoes","type":1,"val":"membershipId","end":""},{"old":"/api/ministerios/:ministryId/membros/:membershipId/funcoes","type":0,"val":"funcoes","end":""}],
    types: placeholder as Registry['members.assign_functions']['types'],
  },
  'ministry_functions.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/funcoes',
    tokens: [{"old":"/api/ministerios/:ministryId/funcoes","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/funcoes","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/funcoes","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/funcoes","type":0,"val":"funcoes","end":""}],
    types: placeholder as Registry['ministry_functions.index']['types'],
  },
  'ministry_functions.store': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/funcoes',
    tokens: [{"old":"/api/ministerios/:ministryId/funcoes","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/funcoes","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/funcoes","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/funcoes","type":0,"val":"funcoes","end":""}],
    types: placeholder as Registry['ministry_functions.store']['types'],
  },
  'ministry_functions.reorder': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/funcoes/ordem',
    tokens: [{"old":"/api/ministerios/:ministryId/funcoes/ordem","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/funcoes/ordem","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/funcoes/ordem","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/funcoes/ordem","type":0,"val":"funcoes","end":""},{"old":"/api/ministerios/:ministryId/funcoes/ordem","type":0,"val":"ordem","end":""}],
    types: placeholder as Registry['ministry_functions.reorder']['types'],
  },
  'ministry_functions.update': {
    methods: ["PATCH"],
    pattern: '/api/ministerios/:ministryId/funcoes/:functionId',
    tokens: [{"old":"/api/ministerios/:ministryId/funcoes/:functionId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/funcoes/:functionId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/funcoes/:functionId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/funcoes/:functionId","type":0,"val":"funcoes","end":""},{"old":"/api/ministerios/:ministryId/funcoes/:functionId","type":1,"val":"functionId","end":""}],
    types: placeholder as Registry['ministry_functions.update']['types'],
  },
  'ministry_functions.archive': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/funcoes/:functionId/arquivar',
    tokens: [{"old":"/api/ministerios/:ministryId/funcoes/:functionId/arquivar","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/funcoes/:functionId/arquivar","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/funcoes/:functionId/arquivar","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/funcoes/:functionId/arquivar","type":0,"val":"funcoes","end":""},{"old":"/api/ministerios/:ministryId/funcoes/:functionId/arquivar","type":1,"val":"functionId","end":""},{"old":"/api/ministerios/:ministryId/funcoes/:functionId/arquivar","type":0,"val":"arquivar","end":""}],
    types: placeholder as Registry['ministry_functions.archive']['types'],
  },
  'songs.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/musicas',
    tokens: [{"old":"/api/ministerios/:ministryId/musicas","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/musicas","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/musicas","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/musicas","type":0,"val":"musicas","end":""}],
    types: placeholder as Registry['songs.index']['types'],
  },
  'songs.store': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/musicas',
    tokens: [{"old":"/api/ministerios/:ministryId/musicas","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/musicas","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/musicas","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/musicas","type":0,"val":"musicas","end":""}],
    types: placeholder as Registry['songs.store']['types'],
  },
  'songs.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/musicas/:songId',
    tokens: [{"old":"/api/ministerios/:ministryId/musicas/:songId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":0,"val":"musicas","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":1,"val":"songId","end":""}],
    types: placeholder as Registry['songs.show']['types'],
  },
  'songs.update': {
    methods: ["PATCH"],
    pattern: '/api/ministerios/:ministryId/musicas/:songId',
    tokens: [{"old":"/api/ministerios/:ministryId/musicas/:songId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":0,"val":"musicas","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":1,"val":"songId","end":""}],
    types: placeholder as Registry['songs.update']['types'],
  },
  'songs.destroy': {
    methods: ["DELETE"],
    pattern: '/api/ministerios/:ministryId/musicas/:songId',
    tokens: [{"old":"/api/ministerios/:ministryId/musicas/:songId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":0,"val":"musicas","end":""},{"old":"/api/ministerios/:ministryId/musicas/:songId","type":1,"val":"songId","end":""}],
    types: placeholder as Registry['songs.destroy']['types'],
  },
  'folders.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/pastas',
    tokens: [{"old":"/api/ministerios/:ministryId/pastas","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/pastas","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/pastas","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/pastas","type":0,"val":"pastas","end":""}],
    types: placeholder as Registry['folders.index']['types'],
  },
  'folders.store': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/pastas',
    tokens: [{"old":"/api/ministerios/:ministryId/pastas","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/pastas","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/pastas","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/pastas","type":0,"val":"pastas","end":""}],
    types: placeholder as Registry['folders.store']['types'],
  },
  'folders.update': {
    methods: ["PATCH"],
    pattern: '/api/ministerios/:ministryId/pastas/:folderId',
    tokens: [{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":0,"val":"pastas","end":""},{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":1,"val":"folderId","end":""}],
    types: placeholder as Registry['folders.update']['types'],
  },
  'folders.destroy': {
    methods: ["DELETE"],
    pattern: '/api/ministerios/:ministryId/pastas/:folderId',
    tokens: [{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":0,"val":"pastas","end":""},{"old":"/api/ministerios/:ministryId/pastas/:folderId","type":1,"val":"folderId","end":""}],
    types: placeholder as Registry['folders.destroy']['types'],
  },
  'classifications.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/classificacoes',
    tokens: [{"old":"/api/ministerios/:ministryId/classificacoes","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/classificacoes","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/classificacoes","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/classificacoes","type":0,"val":"classificacoes","end":""}],
    types: placeholder as Registry['classifications.index']['types'],
  },
  'classifications.store': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/classificacoes',
    tokens: [{"old":"/api/ministerios/:ministryId/classificacoes","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/classificacoes","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/classificacoes","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/classificacoes","type":0,"val":"classificacoes","end":""}],
    types: placeholder as Registry['classifications.store']['types'],
  },
  'classifications.archive': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/classificacoes/:classificationId/arquivar',
    tokens: [{"old":"/api/ministerios/:ministryId/classificacoes/:classificationId/arquivar","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/classificacoes/:classificationId/arquivar","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/classificacoes/:classificationId/arquivar","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/classificacoes/:classificationId/arquivar","type":0,"val":"classificacoes","end":""},{"old":"/api/ministerios/:ministryId/classificacoes/:classificationId/arquivar","type":1,"val":"classificationId","end":""},{"old":"/api/ministerios/:ministryId/classificacoes/:classificationId/arquivar","type":0,"val":"arquivar","end":""}],
    types: placeholder as Registry['classifications.archive']['types'],
  },
  'schedules.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/escalas',
    tokens: [{"old":"/api/ministerios/:ministryId/escalas","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/escalas","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/escalas","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/escalas","type":0,"val":"escalas","end":""}],
    types: placeholder as Registry['schedules.index']['types'],
  },
  'schedules.store': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/escalas',
    tokens: [{"old":"/api/ministerios/:ministryId/escalas","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/escalas","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/escalas","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/escalas","type":0,"val":"escalas","end":""}],
    types: placeholder as Registry['schedules.store']['types'],
  },
  'schedules.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId',
    tokens: [{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":0,"val":"escalas","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":1,"val":"scheduleId","end":""}],
    types: placeholder as Registry['schedules.show']['types'],
  },
  'schedules.update': {
    methods: ["PATCH"],
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId',
    tokens: [{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":0,"val":"escalas","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":1,"val":"scheduleId","end":""}],
    types: placeholder as Registry['schedules.update']['types'],
  },
  'schedules.destroy': {
    methods: ["DELETE"],
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId',
    tokens: [{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":0,"val":"escalas","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId","type":1,"val":"scheduleId","end":""}],
    types: placeholder as Registry['schedules.destroy']['types'],
  },
  'schedules.publish': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId/publicar',
    tokens: [{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/publicar","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/publicar","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/publicar","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/publicar","type":0,"val":"escalas","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/publicar","type":1,"val":"scheduleId","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/publicar","type":0,"val":"publicar","end":""}],
    types: placeholder as Registry['schedules.publish']['types'],
  },
  'schedules.unpublish': {
    methods: ["POST"],
    pattern: '/api/ministerios/:ministryId/escalas/:scheduleId/rascunho',
    tokens: [{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/rascunho","type":0,"val":"api","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/rascunho","type":0,"val":"ministerios","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/rascunho","type":1,"val":"ministryId","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/rascunho","type":0,"val":"escalas","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/rascunho","type":1,"val":"scheduleId","end":""},{"old":"/api/ministerios/:ministryId/escalas/:scheduleId/rascunho","type":0,"val":"rascunho","end":""}],
    types: placeholder as Registry['schedules.unpublish']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}

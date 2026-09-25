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

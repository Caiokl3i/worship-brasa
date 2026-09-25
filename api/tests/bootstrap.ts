import { assert } from '@japa/assert'
import { ApiClient, apiClient } from '@japa/api-client'
import { configProvider } from '@adonisjs/core'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import { dbAssertions } from '@adonisjs/lucid/plugins/db'
import testUtils from '@adonisjs/core/services/test_utils'
import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import { sessionApiClient } from '@adonisjs/session/plugins/api_client'
import type { Registry } from '../.adonisjs/client/registry/schema.d.ts'

type SessionBag = {
  values: Record<string, unknown>
  flashMessages: Record<string, unknown>
}

type MemorySessionStore = {
  write(sessionId: string, values: Record<string, unknown>): Promise<void> | void
}

type ResolvedSessionConfig = {
  cookieName: string
  stores: {
    memory: () => MemorySessionStore
  }
}

/**
 * O plugin de sessão do Japa grava um id novo em cada pedido e apaga
 * a sessão ao terminar. O login ainda troca esse id. Sem isto, o
 * pedido seguinte do mesmo teste não carrega o cookie que acabou de receber.
 */
function keepSessionCookie() {
  return async () => {
    const config = (await configProvider.resolve(
      app,
      app.config.get('session')
    )) as ResolvedSessionConfig | null
    if (!config) {
      return
    }

    const store = config.stores.memory()
    const jars = new WeakMap<ApiClient, { sessionId?: string }>()
    const request = ApiClient.prototype.request

    ApiClient.prototype.request = function (endpoint: string, method: string) {
      const apiRequest = request.call(this, endpoint, method)
      let jar = jars.get(this)
      if (!jar) {
        jar = {}
        jars.set(this, jar)
      }

      const state = jar
      apiRequest.setup(async () => {
        if (state.sessionId) {
          apiRequest.cookie(config.cookieName, state.sessionId)
        }
      })

      apiRequest.teardown(async (response) => {
        const cookie = response.cookie(config.cookieName)
        const bag = (response as { sessionBag?: SessionBag }).sessionBag
        if (!cookie?.value || !bag) {
          state.sessionId = undefined
          return
        }

        state.sessionId = cookie.value
        const values = { ...bag.values }
        if (Object.keys(bag.flashMessages).length > 0) {
          values.__flash__ = bag.flashMessages
        }
        await store.write(cookie.value, values)
      })

      return apiRequest
    }
  }
}

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */
declare module '@japa/api-client/types' {
  interface RoutesRegistry extends Registry {}
}

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  assert(),
  pluginAdonisJS(app),
  dbAssertions(app),
  apiClient(),
  sessionApiClient(app),
  authApiClient(app),
  keepSessionCookie(),
]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    return suite.setup(() => testUtils.httpServer().start())
  }
}

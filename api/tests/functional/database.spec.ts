import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

test.group('Banco', () => {
  test('o lucid conecta no postgres', async ({ assert }) => {
    const result = await db.rawQuery('select 1 as ok')

    assert.equal(Number(result.rows[0].ok), 1)
  })

  test('health continua público', async ({ client }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    response.assertBodyContains({ status: 'ok', timezone: 'America/Sao_Paulo' })
  })
})

import { test } from '@japa/runner'
import db from '@adonisjs/lucid/services/db'

test.group('Banco', () => {
  test('o lucid conecta no postgres', async ({ assert }) => {
    const result = await db.rawQuery('select 1 as ok')

    assert.equal(Number(result.rows[0].ok), 1)
  })
})
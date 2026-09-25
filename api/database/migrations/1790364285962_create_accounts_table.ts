import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // O kit criou token e um users com id numérico.
    // Esta etapa ainda não tem conta em uso. Recriamos users no formato do plano.
    this.schema.dropTable('auth_access_tokens')
    this.schema.dropTable('users')

    this.schema.createTable('users', (table) => {
      table.uuid('id').primary()
      table.string('name', 120).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password').notNullable()
      table.date('birth_date').nullable()
      table.integer('auth_version').notNullable().defaultTo(1)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })

    this.schema.createTable('password_resets', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('code_hash').notNullable()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('used_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index('user_id')
    })
  }

  async down() {
    this.schema.dropTable('password_resets')
    this.schema.dropTable('users')
  }
}

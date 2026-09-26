import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('email_invites', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('email', 254).notNullable()
      table.text('code_hash').notNullable()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('used_at', { useTz: true }).nullable()
      table
        .uuid('created_by_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable('email_invites')
  }
}

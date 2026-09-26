import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('notices', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table
        .uuid('membership_id')
        .notNullable()
        .references('id')
        .inTable('memberships')
        .onDelete('CASCADE')
      table.string('title', 160).notNullable()
      table.text('body').notNullable()
      table.boolean('pinned').notNullable().defaultTo(false)
      table.date('expires_at').nullable()
      table.timestamp('archived_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('ministry_id')
    })
  }

  async down() {
    this.schema.dropTable('notices')
  }
}

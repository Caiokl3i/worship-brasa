import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('birthday_digests', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.date('local_date').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.unique(['user_id', 'ministry_id', 'local_date'])
    })
  }

  async down() {
    this.schema.dropTable('birthday_digests')
  }
}

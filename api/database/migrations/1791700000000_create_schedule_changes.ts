import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('schedule_changes', (table) => {
      table.uuid('id').primary()
      table
        .uuid('schedule_id')
        .notNullable()
        .references('id')
        .inTable('schedules')
        .onDelete('CASCADE')
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.text('summary').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable('schedule_changes')
  }
}

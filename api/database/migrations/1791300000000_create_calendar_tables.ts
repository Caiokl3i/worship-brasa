import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('calendar_connections', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE')
      table.string('calendar_id').notNullable()
      table.text('refresh_token').nullable()
      table.timestamp('disconnected_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })

    this.schema.createTable('calendar_event_links', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('schedule_id')
        .notNullable()
        .references('id')
        .inTable('schedules')
        .onDelete('CASCADE')
      table.string('external_id').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.unique(['user_id', 'schedule_id'])
    })
  }

  async down() {
    this.schema.dropTable('calendar_event_links')
    this.schema.dropTable('calendar_connections')
  }
}

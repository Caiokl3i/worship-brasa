import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('notifications', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.uuid('schedule_id').nullable().references('id').inTable('schedules').onDelete('CASCADE')
      table.string('type', 40).notNullable()
      table.string('title', 160).notNullable()
      table.text('body').notNullable()
      table.string('link', 240).notNullable()
      table.timestamp('read_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['user_id', 'created_at'])
    })

    this.schema.raw(`
      create unique index notifications_reminder_once
      on notifications (user_id, schedule_id, type)
      where schedule_id is not null
        and type in ('reminder_5d', 'reminder_1d', 'reminder_2h')
    `)

    this.schema.createTable('notification_preferences', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('type', 40).notNullable()
      table.boolean('in_app').notNullable()
      table.boolean('email').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['user_id', 'type'])
    })
  }

  async down() {
    this.schema.dropTable('notification_preferences')
    this.schema.raw('drop index if exists notifications_reminder_once')
    this.schema.dropTable('notifications')
  }
}

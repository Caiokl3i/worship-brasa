import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('chat_threads', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.uuid('schedule_id').nullable().references('id').inTable('schedules').onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('ministry_id')
      table.index('schedule_id')
    })

    this.schema.raw(`
      create unique index chat_threads_ministry_live
      on chat_threads (ministry_id)
      where schedule_id is null
    `)
    this.schema.raw(`
      create unique index chat_threads_schedule_live
      on chat_threads (schedule_id)
      where schedule_id is not null
    `)

    this.schema.createTable('chat_messages', (table) => {
      table.uuid('id').primary()
      table
        .uuid('thread_id')
        .notNullable()
        .references('id')
        .inTable('chat_threads')
        .onDelete('CASCADE')
      table
        .uuid('membership_id')
        .notNullable()
        .references('id')
        .inTable('memberships')
        .onDelete('CASCADE')
      table.text('body').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['thread_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable('chat_messages')
    this.schema.raw('drop index if exists chat_threads_schedule_live')
    this.schema.raw('drop index if exists chat_threads_ministry_live')
    this.schema.dropTable('chat_threads')
  }
}

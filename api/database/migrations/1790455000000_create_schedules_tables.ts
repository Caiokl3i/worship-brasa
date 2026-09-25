import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('schedules', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('title', 160).notNullable()
      table.timestamp('starts_at', { useTz: true }).notNullable()
      table.timestamp('ends_at', { useTz: true }).nullable()
      table.string('status', 16).notNullable().defaultTo('draft')
      table.text('notes').notNullable().defaultTo('')
      table.string('dress_code', 200).notNullable().defaultTo('')
      table.integer('version').notNullable().defaultTo(1)
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index(['ministry_id', 'status'])
    })

    this.schema.createTable('schedule_participants', (table) => {
      table.uuid('id').primary()
      table
        .uuid('schedule_id')
        .notNullable()
        .references('id')
        .inTable('schedules')
        .onDelete('CASCADE')
      table
        .uuid('membership_id')
        .notNullable()
        .references('id')
        .inTable('memberships')
        .onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['schedule_id', 'membership_id'])
      table.index('schedule_id')
    })

    this.schema.createTable('schedule_assignments', (table) => {
      table.uuid('id').primary()
      table
        .uuid('participant_id')
        .notNullable()
        .references('id')
        .inTable('schedule_participants')
        .onDelete('CASCADE')
      table
        .uuid('function_id')
        .notNullable()
        .references('id')
        .inTable('ministry_functions')
        .onDelete('CASCADE')
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['participant_id', 'function_id'])
    })

    this.schema.createTable('schedule_songs', (table) => {
      table.uuid('id').primary()
      table
        .uuid('schedule_id')
        .notNullable()
        .references('id')
        .inTable('schedules')
        .onDelete('CASCADE')
      table.uuid('song_id').notNullable().references('id').inTable('songs').onDelete('RESTRICT')
      table
        .uuid('version_id')
        .nullable()
        .references('id')
        .inTable('song_versions')
        .onDelete('SET NULL')
      table.integer('position').notNullable()
      table.string('key_override', 8).nullable()
      table.text('notes').notNullable().defaultTo('')
      table.integer('duration_seconds').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('schedule_id')
    })

    this.schema.createTable('schedule_song_highlights', (table) => {
      table
        .uuid('schedule_song_id')
        .notNullable()
        .references('id')
        .inTable('schedule_songs')
        .onDelete('CASCADE')
      table
        .uuid('participant_id')
        .notNullable()
        .references('id')
        .inTable('schedule_participants')
        .onDelete('CASCADE')
      table
        .uuid('function_id')
        .notNullable()
        .references('id')
        .inTable('ministry_functions')
        .onDelete('CASCADE')

      table.primary(['schedule_song_id', 'participant_id', 'function_id'])
    })
  }

  async down() {
    this.schema.dropTable('schedule_song_highlights')
    this.schema.dropTable('schedule_songs')
    this.schema.dropTable('schedule_assignments')
    this.schema.dropTable('schedule_participants')
    this.schema.dropTable('schedules')
  }
}

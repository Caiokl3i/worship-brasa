import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('series', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('frequency', 16).notNullable()
      table.integer('interval').notNullable().defaultTo(1)
      table.json('weekdays').notNullable()
      table.string('ends_mode', 16).notNullable()
      table.date('ends_on').nullable()
      table.integer('occurrence_count').nullable()
      table.timestamp('starts_at', { useTz: true }).notNullable()
      table.integer('duration_minutes').nullable()
      table.string('title', 160).notNullable()
      table.text('notes').notNullable().defaultTo('')
      table.string('dress_code', 200).notNullable().defaultTo('')
      table.boolean('confirmation_required').notNullable().defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('ministry_id')
    })

    this.schema.alterTable('schedules', (table) => {
      table.uuid('series_id').nullable().references('id').inTable('series').onDelete('SET NULL')
      table.boolean('detached_from_series').notNullable().defaultTo(false)
      table.timestamp('original_starts_at', { useTz: true }).nullable()
      table.index('series_id')
    })

    this.schema.raw(`
      create unique index schedules_series_original_live
      on schedules (series_id, original_starts_at)
      where deleted_at is null and series_id is not null
    `)
  }

  async down() {
    this.schema.raw('drop index if exists schedules_series_original_live')
    this.schema.alterTable('schedules', (table) => {
      table.dropColumns('series_id', 'detached_from_series', 'original_starts_at')
    })
    this.schema.dropTable('series')
  }
}

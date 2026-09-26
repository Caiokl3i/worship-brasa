import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('ministry_generation_defaults', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .unique()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('people_strategy', 20).notNullable()
      table.integer('history_months').notNullable()
      table.integer('min_gap_days').nullable()
      table.boolean('prefer_fewer_absences').notNullable()
      table.boolean('allow_multiple_functions').notNullable()
      table.string('unavailability_mode', 10).notNullable()
      table.string('conflict_mode', 10).notNullable()
      table.string('song_strategy', 20).notNullable()
      table.integer('song_count').notNullable()
      table.integer('min_song_gap_days').nullable()
      table.boolean('include_unplayed').notNullable()
      table.text('vacancies').notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable('ministry_generation_defaults')
  }
}

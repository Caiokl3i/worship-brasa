import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('script_templates', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('name', 160).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['ministry_id', 'name'])
      table.index('ministry_id')
    })

    this.schema.createTable('script_template_items', (table) => {
      table.uuid('id').primary()
      table
        .uuid('template_id')
        .notNullable()
        .references('id')
        .inTable('script_templates')
        .onDelete('CASCADE')
      table.integer('position').notNullable()
      table.string('title', 160).notNullable()
      table.text('notes').notNullable().defaultTo('')
      table.integer('duration_seconds').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['template_id', 'position'])
      table.index('template_id')
    })

    this.schema.createTable('script_items', (table) => {
      table.uuid('id').primary()
      table
        .uuid('schedule_id')
        .notNullable()
        .references('id')
        .inTable('schedules')
        .onDelete('CASCADE')
      table.integer('position').notNullable()
      table.string('title', 160).notNullable()
      table.text('notes').notNullable().defaultTo('')
      table.integer('duration_seconds').nullable()
      table.string('source', 16).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['schedule_id', 'position'])
      table.index('schedule_id')
    })

    this.schema.createTable('series_script_items', (table) => {
      table.uuid('id').primary()
      table.uuid('series_id').notNullable().references('id').inTable('series').onDelete('CASCADE')
      table.integer('position').notNullable()
      table.string('title', 160).notNullable()
      table.text('notes').notNullable().defaultTo('')
      table.integer('duration_seconds').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['series_id', 'position'])
      table.index('series_id')
    })
  }

  async down() {
    this.schema.dropTable('series_script_items')
    this.schema.dropTable('script_items')
    this.schema.dropTable('script_template_items')
    this.schema.dropTable('script_templates')
  }
}

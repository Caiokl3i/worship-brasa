import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('ministries', (table) => {
      table.uuid('id').primary()
      table.string('name', 120).notNullable()
      table.string('timezone', 64).notNullable()
      table.string('color', 7).notNullable()
      table.boolean('music_module_enabled').notNullable().defaultTo(true)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()
    })

    this.schema.createTable('memberships', (table) => {
      table.uuid('id').primary()
      table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('status', 16).notNullable()
      table.boolean('is_admin').notNullable().defaultTo(false)
      table.boolean('can_manage_schedules').notNullable().defaultTo(false)
      table.boolean('can_manage_repertoire').notNullable().defaultTo(false)
      table.boolean('can_manage_functions').notNullable().defaultTo(false)
      table.boolean('can_edit_schedule_songs').notNullable().defaultTo(false)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.unique(['user_id', 'ministry_id'])
      table.index(['ministry_id', 'status'])
    })

    this.schema.createTable('ministry_functions', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('name', 80).notNullable()
      table.integer('sort_order').notNullable()
      table.timestamp('archived_at', { useTz: true }).nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('ministry_id')
    })

    this.schema.createTable('member_functions', (table) => {
      table
        .uuid('membership_id')
        .notNullable()
        .references('id')
        .inTable('memberships')
        .onDelete('CASCADE')
      table
        .uuid('function_id')
        .notNullable()
        .references('id')
        .inTable('ministry_functions')
        .onDelete('CASCADE')

      table.primary(['membership_id', 'function_id'])
    })

    this.schema.createTable('invites', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('code', 6).notNullable().unique()
      table
        .uuid('created_by_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('revoked_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()

      table.index('ministry_id')
    })

    this.schema.raw(
      'create unique index invites_one_open_per_ministry on invites (ministry_id) where revoked_at is null'
    )
  }

  async down() {
    this.schema.raw('drop index if exists invites_one_open_per_ministry')
    this.schema.dropTable('member_functions')
    this.schema.dropTable('invites')
    this.schema.dropTable('ministry_functions')
    this.schema.dropTable('memberships')
    this.schema.dropTable('ministries')
  }
}

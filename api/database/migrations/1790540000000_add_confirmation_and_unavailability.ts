import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('schedules', (table) => {
      table.boolean('confirmation_required').notNullable().defaultTo(true)
    })

    this.schema.alterTable('schedule_participants', (table) => {
      table.string('confirmation', 16).notNullable().defaultTo('pending')
      table.timestamp('confirmed_at', { useTz: true }).nullable()
      table.boolean('absent').notNullable().defaultTo(false)
      table.timestamp('absent_at', { useTz: true }).nullable()
    })

    this.schema.createTable('unavailabilities', (table) => {
      table.uuid('id').primary()
      table
        .uuid('membership_id')
        .notNullable()
        .references('id')
        .inTable('memberships')
        .onDelete('CASCADE')
      table.date('starts_on').notNullable()
      table.date('ends_on').notNullable()
      table.text('description').notNullable().defaultTo('')
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('membership_id')
    })
  }

  async down() {
    this.schema.dropTable('unavailabilities')
    this.schema.alterTable('schedule_participants', (table) => {
      table.dropColumns('confirmation', 'confirmed_at', 'absent', 'absent_at')
    })
    this.schema.alterTable('schedules', (table) => {
      table.dropColumn('confirmation_required')
    })
  }
}

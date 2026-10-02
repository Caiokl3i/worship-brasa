import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('songs', (table) => {
      table.string('notes', 150).nullable()
    })
  }

  async down() {
    this.schema.alterTable('songs', (table) => {
      table.dropColumn('notes')
    })
  }
}

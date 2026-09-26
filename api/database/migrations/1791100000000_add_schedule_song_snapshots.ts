import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('schedule_songs', (table) => {
      table.string('title_snapshot', 160).nullable()
      table.string('artist_snapshot', 160).nullable()
    })
  }

  async down() {
    this.schema.alterTable('schedule_songs', (table) => {
      table.dropColumns('title_snapshot', 'artist_snapshot')
    })
  }
}

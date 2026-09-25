import { randomUUID } from 'node:crypto'
import { BaseSchema } from '@adonisjs/lucid/schema'
import { DEFAULT_CLASSIFICATIONS } from '#ministries/repertoire'

export default class extends BaseSchema {
  async up() {
    this.schema.createTable('classifications', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('name', 80).notNullable()
      table.string('description', 400).notNullable().defaultTo('')
      table.timestamp('archived_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('ministry_id')
    })

    this.schema.createTable('folders', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('name', 80).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('ministry_id')
    })

    this.schema.createTable('songs', (table) => {
      table.uuid('id').primary()
      table
        .uuid('ministry_id')
        .notNullable()
        .references('id')
        .inTable('ministries')
        .onDelete('CASCADE')
      table.string('title', 160).notNullable()
      table.string('artist', 160).nullable()
      table.integer('bpm').nullable()
      table.integer('duration_seconds').nullable()
      table.string('default_key', 8).nullable()
      table
        .uuid('classification_id')
        .nullable()
        .references('id')
        .inTable('classifications')
        .onDelete('SET NULL')
      table.uuid('folder_id').nullable().references('id').inTable('folders').onDelete('SET NULL')
      table.timestamp('deleted_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('ministry_id')
    })

    this.schema.createTable('song_versions', (table) => {
      table.uuid('id').primary()
      table.uuid('song_id').notNullable().references('id').inTable('songs').onDelete('CASCADE')
      table.string('name', 80).notNullable()
      table.string('key', 8).nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('song_id')
    })

    this.schema.createTable('song_links', (table) => {
      table.uuid('id').primary()
      table.uuid('song_id').notNullable().references('id').inTable('songs').onDelete('CASCADE')
      table
        .uuid('version_id')
        .nullable()
        .references('id')
        .inTable('song_versions')
        .onDelete('CASCADE')
      table.string('kind', 16).notNullable()
      table.string('label', 80).notNullable()
      table.string('url', 500).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).nullable()

      table.index('song_id')
    })

    this.defer(async (db) => {
      const ministries = await db.from('ministries').select('id')
      const now = Date.now()

      for (const ministry of ministries) {
        const existing = await db.from('classifications').where('ministry_id', ministry.id).first()

        if (existing) {
          continue
        }

        await db.table('classifications').multiInsert(
          DEFAULT_CLASSIFICATIONS.map((item, index) => ({
            id: randomUUID(),
            ministry_id: ministry.id,
            name: item.name,
            description: item.description,
            created_at: new Date(now + index),
            updated_at: new Date(now + index),
          }))
        )
      }
    })
  }

  async down() {
    this.schema.dropTable('song_links')
    this.schema.dropTable('song_versions')
    this.schema.dropTable('songs')
    this.schema.dropTable('folders')
    this.schema.dropTable('classifications')
  }
}

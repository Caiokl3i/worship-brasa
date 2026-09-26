import { randomUUID } from 'node:crypto'
import { ScriptTemplateItemSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ScriptTemplate from '#models/script_template'

export default class ScriptTemplateItem extends ScriptTemplateItemSchema {
  @beforeCreate()
  static assignId(item: ScriptTemplateItem) {
    item.id = randomUUID()
  }

  @belongsTo(() => ScriptTemplate, { foreignKey: 'templateId' })
  declare template: BelongsTo<typeof ScriptTemplate>
}

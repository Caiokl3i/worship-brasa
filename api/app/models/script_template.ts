import { randomUUID } from 'node:crypto'
import { ScriptTemplateSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Ministry from '#models/ministry'
import ScriptTemplateItem from '#models/script_template_item'

export default class ScriptTemplate extends ScriptTemplateSchema {
  @beforeCreate()
  static assignId(template: ScriptTemplate) {
    template.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>

  @hasMany(() => ScriptTemplateItem, { foreignKey: 'templateId' })
  declare items: HasMany<typeof ScriptTemplateItem>
}

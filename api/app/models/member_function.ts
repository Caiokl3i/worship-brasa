import { MemberFunctionSchema } from '#database/schema'
import { column } from '@adonisjs/lucid/orm'

export default class MemberFunction extends MemberFunctionSchema {
  @column({ isPrimary: true })
  declare functionId: string
}

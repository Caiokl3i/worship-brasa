import { ScheduleSongHighlightSchema } from '#database/schema'
import { belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ScheduleSong from '#models/schedule_song'
import ScheduleParticipant from '#models/schedule_participant'
import MinistryFunction from '#models/ministry_function'

export default class ScheduleSongHighlight extends ScheduleSongHighlightSchema {
  @column({ isPrimary: true })
  declare participantId: string

  @column({ isPrimary: true })
  declare functionId: string

  @belongsTo(() => ScheduleSong)
  declare scheduleSong: BelongsTo<typeof ScheduleSong>

  @belongsTo(() => ScheduleParticipant, { foreignKey: 'participantId' })
  declare participant: BelongsTo<typeof ScheduleParticipant>

  @belongsTo(() => MinistryFunction, { foreignKey: 'functionId' })
  declare function: BelongsTo<typeof MinistryFunction>
}

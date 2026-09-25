import { randomUUID } from 'node:crypto'
import { ScheduleAssignmentSchema } from '#database/schema'
import { beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import ScheduleParticipant from '#models/schedule_participant'
import MinistryFunction from '#models/ministry_function'

export default class ScheduleAssignment extends ScheduleAssignmentSchema {
  @beforeCreate()
  static assignId(assignment: ScheduleAssignment) {
    assignment.id = randomUUID()
  }

  @belongsTo(() => ScheduleParticipant, { foreignKey: 'participantId' })
  declare participant: BelongsTo<typeof ScheduleParticipant>

  @belongsTo(() => MinistryFunction, { foreignKey: 'functionId' })
  declare function: BelongsTo<typeof MinistryFunction>
}

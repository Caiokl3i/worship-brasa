import { randomUUID } from 'node:crypto'
import { ScheduleParticipantSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Schedule from '#models/schedule'
import Membership from '#models/membership'
import ScheduleAssignment from '#models/schedule_assignment'
import ScheduleSongHighlight from '#models/schedule_song_highlight'

export default class ScheduleParticipant extends ScheduleParticipantSchema {
  @beforeCreate()
  static assignId(participant: ScheduleParticipant) {
    participant.id = randomUUID()
  }

  @belongsTo(() => Schedule)
  declare schedule: BelongsTo<typeof Schedule>

  @belongsTo(() => Membership)
  declare membership: BelongsTo<typeof Membership>

  @hasMany(() => ScheduleAssignment, { foreignKey: 'participantId' })
  declare assignments: HasMany<typeof ScheduleAssignment>

  @hasMany(() => ScheduleSongHighlight, { foreignKey: 'participantId' })
  declare highlights: HasMany<typeof ScheduleSongHighlight>
}

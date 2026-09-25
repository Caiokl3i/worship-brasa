import { randomUUID } from 'node:crypto'
import { ScheduleSchema } from '#database/schema'
import { beforeCreate, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Ministry from '#models/ministry'
import ScheduleParticipant from '#models/schedule_participant'
import ScheduleSong from '#models/schedule_song'

export type ScheduleStatus = 'draft' | 'published'

export default class Schedule extends ScheduleSchema {
  @beforeCreate()
  static assignId(schedule: Schedule) {
    schedule.id = randomUUID()
  }

  @belongsTo(() => Ministry)
  declare ministry: BelongsTo<typeof Ministry>

  @hasMany(() => ScheduleParticipant)
  declare participants: HasMany<typeof ScheduleParticipant>

  @hasMany(() => ScheduleSong)
  declare songs: HasMany<typeof ScheduleSong>
}

import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import db from '@adonisjs/lucid/services/db'
import Schedule from '#models/schedule'
import ScheduleParticipant from '#models/schedule_participant'
import ScheduleSong from '#models/schedule_song'
import ScriptItem from '#models/script_item'
import ScriptTemplate from '#models/script_template'
import ScriptTemplateItem from '#models/script_template_item'
import SeriesScriptItem from '#models/series_script_item'
import type Membership from '#models/membership'
import {
  FieldException,
  ScheduleConflictException,
  ScheduleNotFoundException,
  ScriptTemplateNotFoundException,
} from '#exceptions/ministry_exceptions'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import { effectiveKey } from '#schedules/effective_key'
import {
  DEFAULT_SCRIPT_TEMPLATE_NAME,
  DEFAULT_SCRIPT_TITLES,
  layoutFromParts,
  layoutFromRows,
  type ScriptDraft,
  type ScriptSong,
  type ScriptSource,
} from '#schedules/script_layout'
import { DateTime } from 'luxon'

type SeriesScope = 'only_this' | 'this_and_following' | 'all'

export type ScriptItemInput = {
  title: string
  notes?: string | null
  durationSeconds?: number | null
}

export type ScriptWriteInput = {
  version: number
  items: ScriptItemInput[]
  scope?: SeriesScope
  replaceFilled?: boolean
}

function drafts(items: ScriptItemInput[]): ScriptDraft[] {
  return items.map((item) => ({
    title: item.title.trim(),
    notes: item.notes?.trim() ?? '',
    durationSeconds: item.durationSeconds ?? null,
  }))
}

export default class ScriptService {
  async list(actor: Membership) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    await ensureDefaultTemplate(actor.ministryId)
    return ScriptTemplate.query()
      .where('ministryId', actor.ministryId)
      .preload('items', (query) => query.orderBy('position', 'asc'))
      .orderBy('name', 'asc')
  }

  async create(actor: Membership, name: string, items: ScriptItemInput[]) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    const trimmed = name.trim()
    return db.transaction(async (trx) => {
      await assertTemplateName(actor.ministryId, trimmed, null, trx)
      return createTemplate(actor.ministryId, trimmed, drafts(items), trx)
    })
  }

  async update(actor: Membership, templateId: string, name: string, items: ScriptItemInput[]) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    const trimmed = name.trim()
    return db.transaction(async (trx) => {
      const template = await findTemplate(actor.ministryId, templateId, trx)
      await assertTemplateName(actor.ministryId, trimmed, template.id, trx)
      template.name = trimmed
      template.useTransaction(trx)
      await template.save()
      await replaceTemplateItems(template.id, drafts(items), trx)
      await template.load('items', (query) => query.orderBy('position', 'asc'))
      return template
    })
  }

  async save(actor: Membership, scheduleId: string, input: ScriptWriteInput) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    await db.transaction(async (trx) => {
      const schedule = await lockSchedule(actor, scheduleId, trx)
      assertVersion(schedule, input.version)
      const manuals = drafts(input.items)
      await writeScheduleStructure(schedule.id, manuals, trx)
      await spreadStructure(schedule, manuals, input.scope, input.replaceFilled === true, trx)
      schedule.version += 1
      schedule.useTransaction(trx)
      await schedule.save()
    })
  }

  async apply(
    actor: Membership,
    scheduleId: string,
    templateId: string,
    input: { version: number; scope?: SeriesScope; replaceFilled?: boolean }
  ) {
    new MembershipAccessService().assertCanManageSchedules(actor)
    await db.transaction(async (trx) => {
      const schedule = await lockSchedule(actor, scheduleId, trx)
      assertVersion(schedule, input.version)
      const template = await findTemplate(actor.ministryId, templateId, trx)
      const items = await ScriptTemplateItem.query({ client: trx })
        .where('templateId', template.id)
        .orderBy('position', 'asc')
      const manuals = items.map((item) => ({
        title: item.title,
        notes: item.notes,
        durationSeconds: item.durationSeconds,
      }))
      await writeScheduleStructure(schedule.id, manuals, trx)
      await spreadStructure(schedule, manuals, input.scope, input.replaceFilled === true, trx)
      schedule.version += 1
      schedule.useTransaction(trx)
      await schedule.save()
    })
  }
}

export async function ensureDefaultTemplate(
  ministryId: string,
  trx?: TransactionClientContract
): Promise<ScriptTemplate> {
  if (!trx) {
    return db.transaction((inner) => ensureDefaultTemplate(ministryId, inner))
  }

  const existing = await ScriptTemplate.query({ client: trx })
    .where('ministryId', ministryId)
    .first()
  if (existing) {
    return existing
  }

  return createTemplate(
    ministryId,
    DEFAULT_SCRIPT_TEMPLATE_NAME,
    DEFAULT_SCRIPT_TITLES.map((title) => ({
      title,
      notes: '',
      durationSeconds: null,
    })),
    trx
  )
}

export async function snapshotDefaultSeriesScript(
  seriesId: string,
  ministryId: string,
  trx: TransactionClientContract
) {
  await ensureDefaultTemplate(ministryId, trx)
  const template = await ScriptTemplate.query({ client: trx })
    .where('ministryId', ministryId)
    .where('name', DEFAULT_SCRIPT_TEMPLATE_NAME)
    .first()
  if (!template) {
    return
  }

  const items = await ScriptTemplateItem.query({ client: trx })
    .where('templateId', template.id)
    .orderBy('position', 'asc')
  await replaceSeriesItems(
    seriesId,
    items.map((item) => ({
      title: item.title,
      notes: item.notes,
      durationSeconds: item.durationSeconds,
    })),
    trx
  )
}

export async function copySeriesScript(
  fromSeriesId: string,
  toSeriesId: string,
  trx: TransactionClientContract
) {
  const items = await SeriesScriptItem.query({ client: trx })
    .where('seriesId', fromSeriesId)
    .orderBy('position', 'asc')
  if (items.length === 0) {
    return
  }

  await replaceSeriesItems(
    toSeriesId,
    items.map((item) => ({
      title: item.title,
      notes: item.notes,
      durationSeconds: item.durationSeconds,
    })),
    trx
  )
}

export async function copySeriesScriptToSchedule(
  seriesId: string,
  scheduleId: string,
  trx?: TransactionClientContract
) {
  const items = await SeriesScriptItem.query(trx ? { client: trx } : {})
    .where('seriesId', seriesId)
    .orderBy('position', 'asc')
  if (items.length === 0) {
    return
  }

  await writeScheduleStructure(
    scheduleId,
    items.map((item) => ({
      title: item.title,
      notes: item.notes,
      durationSeconds: item.durationSeconds,
    })),
    trx
  )
}

export async function rebuildScheduleScript(scheduleId: string, trx: TransactionClientContract) {
  const stored = await ScriptItem.query({ client: trx })
    .where('scheduleId', scheduleId)
    .orderBy('position', 'asc')
  const songs = await loadScriptSongs(scheduleId, trx)
  const rows = layoutFromRows(
    stored.map((item) => ({
      title: item.title,
      notes: item.notes,
      durationSeconds: item.durationSeconds,
      source: item.source as ScriptSource,
    })),
    songs
  )
  await replaceScriptItems(scheduleId, rows, trx)
}

async function spreadStructure(
  schedule: Schedule,
  manuals: ScriptDraft[],
  scope: SeriesScope | undefined,
  replaceFilled: boolean,
  trx: TransactionClientContract
) {
  const linked = Boolean(schedule.seriesId) && !schedule.detachedFromSeries
  if (!linked) {
    return
  }
  if (!scope) {
    throw new FieldException('scope', 'Escolha o alcance da alteração.')
  }
  if (scope === 'only_this' || !schedule.seriesId) {
    return
  }

  const seriesId = schedule.seriesId
  await replaceSeriesItems(seriesId, manuals, trx)
  const now = DateTime.utc().toMillis()
  const pivot = (schedule.originalStartsAt ?? schedule.startsAt).toUTC().toMillis()
  const siblings = await Schedule.query({ client: trx })
    .where('seriesId', seriesId)
    .whereNull('deletedAt')
    .whereNot('id', schedule.id)

  for (const row of siblings) {
    if (row.detachedFromSeries) {
      continue
    }
    const origin = (row.originalStartsAt ?? row.startsAt).toUTC().toMillis()
    if (origin < now) {
      continue
    }
    if (scope === 'this_and_following' && origin < pivot) {
      continue
    }
    if ((await scheduleFilled(row.id, trx)) && !replaceFilled) {
      continue
    }
    await writeScheduleStructure(row.id, manuals, trx)
    row.version += 1
    row.useTransaction(trx)
    await row.save()
  }
}

async function writeScheduleStructure(
  scheduleId: string,
  manuals: ScriptDraft[],
  trx?: TransactionClientContract
) {
  const songs = await loadScriptSongs(scheduleId, trx)
  await replaceScriptItems(scheduleId, layoutFromParts(manuals, songs), trx)
}

async function loadScriptSongs(scheduleId: string, trx?: TransactionClientContract) {
  const rows = await ScheduleSong.query(trx ? { client: trx } : {})
    .where('scheduleId', scheduleId)
    .orderBy('position', 'asc')
    .preload('song')
    .preload('version')

  return rows.map((row): ScriptSong => ({
    title: row.song.title,
    notes: row.notes,
    durationSeconds: row.durationSeconds,
    effectiveKey: effectiveKey({
      keyOverride: row.keyOverride,
      versionKey: row.versionId ? row.version.key : null,
      defaultKey: row.song.defaultKey,
    }),
  }))
}

async function replaceScriptItems(
  scheduleId: string,
  rows: Array<{
    source: ScriptSource
    title: string
    notes: string
    durationSeconds: number | null
  }>,
  trx?: TransactionClientContract
) {
  await ScriptItem.query(trx ? { client: trx } : {})
    .where('scheduleId', scheduleId)
    .delete()

  for (const [index, row] of rows.entries()) {
    await ScriptItem.create(
      {
        scheduleId,
        position: index + 1,
        title: row.title,
        notes: row.notes,
        durationSeconds: row.durationSeconds,
        source: row.source,
      },
      trx ? { client: trx } : undefined
    )
  }
}

async function replaceSeriesItems(
  seriesId: string,
  items: ScriptDraft[],
  trx: TransactionClientContract
) {
  await SeriesScriptItem.query({ client: trx }).where('seriesId', seriesId).delete()
  for (const [index, item] of items.entries()) {
    await SeriesScriptItem.create(
      {
        seriesId,
        position: index + 1,
        title: item.title,
        notes: item.notes,
        durationSeconds: item.durationSeconds,
      },
      { client: trx }
    )
  }
}

async function replaceTemplateItems(
  templateId: string,
  items: ScriptDraft[],
  trx: TransactionClientContract
) {
  await ScriptTemplateItem.query({ client: trx }).where('templateId', templateId).delete()
  for (const [index, item] of items.entries()) {
    await ScriptTemplateItem.create(
      {
        templateId,
        position: index + 1,
        title: item.title,
        notes: item.notes,
        durationSeconds: item.durationSeconds,
      },
      { client: trx }
    )
  }
}

async function createTemplate(
  ministryId: string,
  name: string,
  items: ScriptDraft[],
  trx: TransactionClientContract
) {
  const template = await ScriptTemplate.create({ ministryId, name }, { client: trx })
  await replaceTemplateItems(template.id, items, trx)
  await template.load('items', (query) => query.orderBy('position', 'asc'))
  return template
}

async function findTemplate(
  ministryId: string,
  templateId: string,
  trx: TransactionClientContract
) {
  if (!isUuid(templateId)) {
    throw new ScriptTemplateNotFoundException()
  }

  const template = await ScriptTemplate.query({ client: trx })
    .where('id', templateId)
    .where('ministryId', ministryId)
    .first()
  if (!template) {
    throw new ScriptTemplateNotFoundException()
  }
  return template
}

async function assertTemplateName(
  ministryId: string,
  name: string,
  ignoreId: string | null,
  trx: TransactionClientContract
) {
  const query = ScriptTemplate.query({ client: trx })
    .where('ministryId', ministryId)
    .where('name', name)
  if (ignoreId) {
    query.whereNot('id', ignoreId)
  }
  const clash = await query.first()
  if (clash) {
    throw new FieldException('name', 'Já existe um modelo com esse nome.')
  }
}

async function lockSchedule(actor: Membership, scheduleId: string, trx: TransactionClientContract) {
  if (!isUuid(scheduleId)) {
    throw new ScheduleNotFoundException()
  }

  const schedule = await Schedule.query({ client: trx })
    .where('id', scheduleId)
    .where('ministryId', actor.ministryId)
    .whereNull('deletedAt')
    .forUpdate()
    .first()
  if (!schedule) {
    throw new ScheduleNotFoundException()
  }
  if (schedule.status === 'draft' && !new MembershipAccessService().managesSchedules(actor)) {
    throw new ScheduleNotFoundException()
  }
  return schedule
}

function assertVersion(schedule: Schedule, version: number) {
  if (schedule.version !== version) {
    throw new ScheduleConflictException()
  }
}

async function scheduleFilled(scheduleId: string, trx: TransactionClientContract) {
  const participant = await ScheduleParticipant.query({ client: trx })
    .where('scheduleId', scheduleId)
    .first()
  if (participant) {
    return true
  }
  const song = await ScheduleSong.query({ client: trx }).where('scheduleId', scheduleId).first()
  return Boolean(song)
}

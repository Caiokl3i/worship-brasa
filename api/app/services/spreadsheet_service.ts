import type Membership from '#models/membership'
import Classification from '#models/classification'
import Song from '#models/song'
import MembershipAccessService from '#services/membership_access_service'
import SongService from '#services/song_service'
import { isHttpUrl, SONG_KEYS } from '#ministries/repertoire'
import {
  parseRepertoireCsv,
  repertoireTemplate,
  toRepertoireCsv,
  type SpreadsheetRow,
} from '#ministries/spreadsheet'

export type PreviewRow = SpreadsheetRow & {
  action: 'criar' | 'ignorar'
  reason: string
}

export default class SpreadsheetService {
  template(actor: Membership) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    return repertoireTemplate()
  }

  async preview(actor: Membership, csv: string) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    return this.#plan(actor.ministryId, csv)
  }

  async import(actor: Membership, csv: string) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const planned = await this.#plan(actor.ministryId, csv)
    const classifications = await this.#classifications(actor.ministryId)
    const songs = new SongService()
    let created = 0

    for (const row of planned) {
      if (row.action !== 'criar') {
        continue
      }
      const links = []
      if (row.cifra) {
        links.push({ kind: 'cifra', label: 'Cifra', url: row.cifra, versionIndex: null })
      }
      if (row.video) {
        links.push({ kind: 'video', label: 'Vídeo', url: row.video, versionIndex: null })
      }
      await songs.create(actor, {
        title: row.title,
        artist: row.artist || null,
        bpm: row.bpm === '' ? null : Number(row.bpm),
        durationSeconds: null,
        defaultKey: row.key || null,
        classificationId: classifications.get(row.classification.trim().toLowerCase()) ?? null,
        folderId: null,
        versions: [],
        links,
      })
      created += 1
    }

    return { created }
  }

  async export(actor: Membership) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const songs = await Song.query()
      .where('ministryId', actor.ministryId)
      .whereNull('deletedAt')
      .preload('classification')
      .preload('links')
      .orderBy('title', 'asc')

    return toRepertoireCsv(
      songs.map((song) => ({
        title: song.title,
        artist: song.artist,
        defaultKey: song.defaultKey,
        bpm: song.bpm,
        classification: song.classification?.name ?? '',
        cifra: song.links.find((link) => link.kind === 'cifra')?.url ?? '',
        video: song.links.find((link) => link.kind === 'video')?.url ?? '',
      }))
    )
  }

  async #plan(ministryId: string, csv: string) {
    const active = await Song.query().where('ministryId', ministryId).whereNull('deletedAt')
    const taken = new Set(active.map((song) => pair(song.title, song.artist ?? '')))
    const classifications = await this.#classifications(ministryId)
    const rows: PreviewRow[] = []

    for (const row of parseRepertoireCsv(csv)) {
      const reason = invalidReason(row, classifications)
      const key = pair(row.title, row.artist)
      if (!reason && taken.has(key)) {
        rows.push({ ...row, action: 'ignorar', reason: 'Já existe' })
        continue
      }
      if (reason) {
        rows.push({ ...row, action: 'ignorar', reason })
        continue
      }
      taken.add(key)
      rows.push({ ...row, action: 'criar', reason: '' })
    }

    return rows
  }

  async #classifications(ministryId: string) {
    const rows = await Classification.query()
      .where('ministryId', ministryId)
      .whereNull('archivedAt')
    return new Map(rows.map((row) => [row.name.trim().toLowerCase(), row.id]))
  }
}

function pair(title: string, artist: string) {
  return `${title.trim().toLowerCase()}|${artist.trim().toLowerCase()}`
}

function invalidReason(row: SpreadsheetRow, classifications: Map<string, string>) {
  if (!row.title.trim()) {
    return 'Informe o título.'
  }
  if (row.key && !SONG_KEYS.includes(row.key as (typeof SONG_KEYS)[number])) {
    return 'Informe um tom da lista.'
  }
  if (row.bpm) {
    const bpm = Number(row.bpm)
    if (!Number.isInteger(bpm) || bpm < 1 || bpm > 400) {
      return 'O BPM precisa estar entre 1 e 400.'
    }
  }
  if (row.classification && !classifications.has(row.classification.trim().toLowerCase())) {
    return 'Esta classificação não pode ser usada.'
  }
  if ((row.cifra && !isHttpUrl(row.cifra)) || (row.video && !isHttpUrl(row.video))) {
    return 'Informe um link http ou https.'
  }
  return ''
}

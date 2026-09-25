import type { TransactionClientContract } from '@adonisjs/lucid/types/database'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import type Membership from '#models/membership'
import Classification from '#models/classification'
import Folder from '#models/folder'
import Song from '#models/song'
import SongLink from '#models/song_link'
import SongVersion from '#models/song_version'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import { FieldException, SongNotFoundException } from '#exceptions/ministry_exceptions'
import { isHttpUrl, LINK_KINDS, SONG_KEYS, type LinkKind } from '#ministries/repertoire'

type VersionInput = {
  name: string
  key?: string | null
}

type LinkInput = {
  versionIndex?: number | null
  kind: string
  label: string
  url: string
}

export type SongInput = {
  title: string
  artist?: string | null
  bpm?: number | null
  durationSeconds?: number | null
  defaultKey?: string | null
  classificationId?: string | null
  folderId?: string | null
  versions: VersionInput[]
  links: LinkInput[]
}

type PreparedSong = {
  title: string
  artist: string | null
  bpm: number | null
  durationSeconds: number | null
  defaultKey: string | null
  classificationId: string | null
  folderId: string | null
  versions: Array<{ name: string; key: string | null }>
  links: Array<{ versionIndex: number | null; kind: LinkKind; label: string; url: string }>
}

function blankToNull(value: string | null | undefined) {
  const trimmed = value?.trim() ?? ''
  return trimmed.length > 0 ? trimmed : null
}

function assertKey(field: string, value: string | null | undefined) {
  const key = blankToNull(value)
  if (!key) {
    return null
  }

  if (!SONG_KEYS.includes(key as (typeof SONG_KEYS)[number])) {
    throw new FieldException(field, 'Informe um tom da lista.')
  }

  return key
}

function prepare(input: SongInput): PreparedSong {
  const versions = input.versions.map((version, index) => ({
    name: version.name.trim(),
    key: assertKey(`versions.${index}.key`, version.key),
  }))

  const links = input.links.map((link) => {
    if (!isHttpUrl(link.url.trim())) {
      throw new FieldException('url', 'Informe um link http ou https.')
    }

    if (!LINK_KINDS.includes(link.kind as LinkKind)) {
      throw new FieldException('kind', 'Informe o tipo do link.')
    }

    const versionIndex = link.versionIndex ?? null
    if (versionIndex !== null && (!Number.isInteger(versionIndex) || !versions[versionIndex])) {
      throw new FieldException('versionIndex', 'Esta versão não existe.')
    }

    return {
      versionIndex,
      kind: link.kind as LinkKind,
      label: link.label.trim(),
      url: link.url.trim(),
    }
  })

  return {
    title: input.title.trim(),
    artist: blankToNull(input.artist),
    bpm: input.bpm ?? null,
    durationSeconds: input.durationSeconds ?? null,
    defaultKey: assertKey('defaultKey', input.defaultKey),
    classificationId: input.classificationId ?? null,
    folderId: input.folderId ?? null,
    versions,
    links,
  }
}

async function assertClassification(
  ministryId: string,
  classificationId: string | null,
  currentId: string | null
) {
  if (!classificationId) {
    return
  }

  if (!isUuid(classificationId)) {
    throw new FieldException('classificationId', 'Esta classificação não pode ser usada.')
  }

  const classification = await Classification.query()
    .where('id', classificationId)
    .where('ministryId', ministryId)
    .first()

  if (!classification || (classification.archivedAt && classification.id !== currentId)) {
    throw new FieldException('classificationId', 'Esta classificação não pode ser usada.')
  }
}

async function assertFolder(ministryId: string, folderId: string | null) {
  if (!folderId) {
    return
  }

  if (!isUuid(folderId)) {
    throw new FieldException('folderId', 'Esta pasta não pode ser usada.')
  }

  const folder = await Folder.query().where('id', folderId).where('ministryId', ministryId).first()

  if (!folder) {
    throw new FieldException('folderId', 'Esta pasta não pode ser usada.')
  }
}

export default class SongService {
  async list(
    actor: Membership,
    filters: { q?: string; folderId?: string; classificationId?: string }
  ) {
    const query = Song.query().where('ministryId', actor.ministryId).whereNull('deletedAt')

    const term = filters.q?.trim() ?? ''
    if (term) {
      const safe = term.replaceAll('%', '').replaceAll('_', '')
      query.where((builder) => {
        builder.whereILike('title', `%${safe}%`).orWhereILike('artist', `%${safe}%`)
      })
    }

    if (filters.folderId) {
      if (!isUuid(filters.folderId)) {
        return []
      }
      query.where('folderId', filters.folderId)
    }

    if (filters.classificationId) {
      if (!isUuid(filters.classificationId)) {
        return []
      }
      query.where('classificationId', filters.classificationId)
    }

    const songs = await query
    for (const song of songs) {
      await song.load('folder')
      await song.load('classification')
    }
    return songs.sort(
      (left, right) =>
        left.title.localeCompare(right.title, 'pt') ||
        (left.artist ?? '').localeCompare(right.artist ?? '', 'pt')
    )
  }

  async show(actor: Membership, songId: string) {
    return this.#find(actor.ministryId, songId)
  }

  async create(actor: Membership, input: SongInput) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const payload = prepare(input)
    await assertClassification(actor.ministryId, payload.classificationId, null)
    await assertFolder(actor.ministryId, payload.folderId)

    const song = await db.transaction(async (trx) => {
      const created = await Song.create(
        {
          ministryId: actor.ministryId,
          title: payload.title,
          artist: payload.artist,
          bpm: payload.bpm,
          durationSeconds: payload.durationSeconds,
          defaultKey: payload.defaultKey,
          classificationId: payload.classificationId,
          folderId: payload.folderId,
        },
        { client: trx }
      )

      await this.#replaceChildren(created, payload, trx)
      return created
    })

    return this.#find(actor.ministryId, song.id)
  }

  async update(actor: Membership, songId: string, input: SongInput) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const payload = prepare(input)
    const current = await this.#find(actor.ministryId, songId)
    await assertClassification(actor.ministryId, payload.classificationId, current.classificationId)
    await assertFolder(actor.ministryId, payload.folderId)

    await db.transaction(async (trx) => {
      current.useTransaction(trx)
      current.title = payload.title
      current.artist = payload.artist
      current.bpm = payload.bpm
      current.durationSeconds = payload.durationSeconds
      current.defaultKey = payload.defaultKey
      current.classificationId = payload.classificationId
      current.folderId = payload.folderId
      await current.save()
      await this.#replaceChildren(current, payload, trx)
    })

    return this.#find(actor.ministryId, songId)
  }

  async delete(actor: Membership, songId: string) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const song = await this.#find(actor.ministryId, songId)
    song.deletedAt = DateTime.utc()
    await song.save()
  }

  async #replaceChildren(song: Song, payload: PreparedSong, trx: TransactionClientContract) {
    await SongLink.query({ client: trx }).where('songId', song.id).delete()
    await SongVersion.query({ client: trx }).where('songId', song.id).delete()

    const start = DateTime.utc()
    const versionIds: string[] = []

    for (const [index, version] of payload.versions.entries()) {
      const row = new SongVersion()
      row.fill({ songId: song.id, name: version.name, key: version.key })
      row.createdAt = start.plus({ milliseconds: index })
      row.useTransaction(trx)
      await row.save()
      versionIds.push(row.id)
    }

    for (const [index, link] of payload.links.entries()) {
      const row = new SongLink()
      row.fill({
        songId: song.id,
        versionId: link.versionIndex === null ? null : versionIds[link.versionIndex],
        kind: link.kind,
        label: link.label,
        url: link.url,
      })
      row.createdAt = start.plus({ milliseconds: index })
      row.useTransaction(trx)
      await row.save()
    }
  }

  async #find(ministryId: string, songId: string) {
    if (!isUuid(songId)) {
      throw new SongNotFoundException()
    }

    const song = await Song.query()
      .where('id', songId)
      .where('ministryId', ministryId)
      .whereNull('deletedAt')
      .first()

    if (!song) {
      throw new SongNotFoundException()
    }

    await song.load('folder')
    await song.load('classification')
    await song.load('versions', (versions) => versions.orderBy('createdAt', 'asc'))
    await song.load('links', (links) => links.orderBy('createdAt', 'asc'))

    return song
  }
}

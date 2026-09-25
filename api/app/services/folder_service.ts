import db from '@adonisjs/lucid/services/db'
import type Membership from '#models/membership'
import Folder from '#models/folder'
import Song from '#models/song'
import MembershipAccessService, { isUuid } from '#services/membership_access_service'
import { FieldException, FolderNotFoundException } from '#exceptions/ministry_exceptions'

async function nameTaken(ministryId: string, name: string, exceptId?: string) {
  const query = Folder.query()
    .where('ministryId', ministryId)
    .whereRaw('lower(name) = ?', [name.toLowerCase()])

  if (exceptId) {
    query.whereNot('id', exceptId)
  }

  return query.first()
}

export default class FolderService {
  async list(actor: Membership) {
    const folders = await Folder.query().where('ministryId', actor.ministryId)
    return folders.sort((left, right) => left.name.localeCompare(right.name, 'pt'))
  }

  async create(actor: Membership, name: string) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const trimmed = name.trim()

    if (await nameTaken(actor.ministryId, trimmed)) {
      throw new FieldException('name', 'Já existe uma pasta com esse nome.')
    }

    return Folder.create({ ministryId: actor.ministryId, name: trimmed })
  }

  async rename(actor: Membership, folderId: string, name: string) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const folder = await this.#inMinistry(actor.ministryId, folderId)
    const trimmed = name.trim()

    if (await nameTaken(actor.ministryId, trimmed, folder.id)) {
      throw new FieldException('name', 'Já existe uma pasta com esse nome.')
    }

    folder.name = trimmed
    await folder.save()
    return folder
  }

  async delete(actor: Membership, folderId: string) {
    new MembershipAccessService().assertCanManageRepertoire(actor)
    const folder = await this.#inMinistry(actor.ministryId, folderId)

    await db.transaction(async (trx) => {
      await Song.query({ client: trx })
        .where('ministryId', actor.ministryId)
        .where('folderId', folder.id)
        .update({ folderId: null })

      folder.useTransaction(trx)
      await folder.delete()
    })
  }

  async #inMinistry(ministryId: string, folderId: string) {
    if (!isUuid(folderId)) {
      throw new FolderNotFoundException()
    }

    const folder = await Folder.query()
      .where('id', folderId)
      .where('ministryId', ministryId)
      .first()

    if (!folder) {
      throw new FolderNotFoundException()
    }

    return folder
  }
}

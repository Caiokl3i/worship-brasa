import type { HttpContext } from '@adonisjs/core/http'
import FolderService from '#services/folder_service'
import { createFolderValidator, renameFolderValidator } from '#validators/repertoire'
import { toFolder } from '#ministries/public_song'

export default class FoldersController {
  async index({ membership, response }: HttpContext) {
    const folders = await new FolderService().list(membership)
    return response.ok({ folders: folders.map(toFolder) })
  }

  async store({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(createFolderValidator)
    const folder = await new FolderService().create(membership, payload.name)
    return response.created(toFolder(folder))
  }

  async update({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(renameFolderValidator)
    const folder = await new FolderService().rename(membership, params.folderId, payload.name)
    return response.ok(toFolder(folder))
  }

  async destroy({ membership, params, response }: HttpContext) {
    await new FolderService().delete(membership, params.folderId)
    return response.noContent()
  }
}

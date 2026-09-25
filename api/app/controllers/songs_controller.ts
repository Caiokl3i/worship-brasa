import type { HttpContext } from '@adonisjs/core/http'
import SongService from '#services/song_service'
import { saveSongValidator } from '#validators/repertoire'
import { toSongDetail, toSongSummary } from '#ministries/public_song'

export default class SongsController {
  async index({ membership, request, response }: HttpContext) {
    const songs = await new SongService().list(membership, {
      q: String(request.input('q', '')).trim().slice(0, 120),
      folderId: request.input('folderId') ? String(request.input('folderId')) : undefined,
      classificationId: request.input('classificationId')
        ? String(request.input('classificationId'))
        : undefined,
    })

    return response.ok({ songs: songs.map(toSongSummary) })
  }

  async store({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveSongValidator)
    const song = await new SongService().create(membership, payload)
    return response.created(toSongDetail(song))
  }

  async show({ membership, params, response }: HttpContext) {
    const song = await new SongService().show(membership, params.songId)
    return response.ok(toSongDetail(song))
  }

  async update({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveSongValidator)
    const song = await new SongService().update(membership, params.songId, payload)
    return response.ok(toSongDetail(song))
  }

  async destroy({ membership, params, response }: HttpContext) {
    await new SongService().delete(membership, params.songId)
    return response.noContent()
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import NoticeService from '#services/notice_service'
import { saveNoticeValidator } from '#validators/notice'
import { toNotice } from '#ministries/public_notice'

export default class NoticesController {
  async index({ membership, response }: HttpContext) {
    const lists = await new NoticeService().list(membership)
    return response.ok({
      notices: lists.notices.map(toNotice),
      pinned: lists.pinned.map(toNotice),
      archived: lists.archived.map(toNotice),
    })
  }

  async store({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveNoticeValidator)
    const notice = await new NoticeService().create(membership, payload)
    return response.created(toNotice(notice))
  }

  async update({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(saveNoticeValidator)
    const notice = await new NoticeService().update(membership, params.noticeId, payload)
    return response.ok(toNotice(notice))
  }

  async archive({ membership, params, response }: HttpContext) {
    const notice = await new NoticeService().archive(membership, params.noticeId)
    return response.ok(toNotice(notice))
  }

  async unarchive({ membership, params, response }: HttpContext) {
    const notice = await new NoticeService().unarchive(membership, params.noticeId)
    return response.ok(toNotice(notice))
  }
}

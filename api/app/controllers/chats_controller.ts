import type { HttpContext } from '@adonisjs/core/http'
import ChatService from '#services/chat_service'
import { sendChatMessageValidator } from '#validators/chat'
import { toChatMessage } from '#ministries/public_chat'

export default class ChatsController {
  async ministry({ membership, request, response }: HttpContext) {
    const page = await new ChatService().ministryPage(membership, request.input('before'))
    return response.ok({
      messages: page.messages.map(toChatMessage),
      hasMore: page.hasMore,
    })
  }

  async sendMinistry({ membership, request, response }: HttpContext) {
    const payload = await request.validateUsing(sendChatMessageValidator)
    const message = await new ChatService().sendToMinistry(membership, payload.body)
    return response.created(toChatMessage(message))
  }

  async schedule({ membership, params, request, response }: HttpContext) {
    const page = await new ChatService().schedulePage(
      membership,
      params.scheduleId,
      request.input('before')
    )
    return response.ok({
      messages: page.messages.map(toChatMessage),
      hasMore: page.hasMore,
    })
  }

  async sendSchedule({ membership, params, request, response }: HttpContext) {
    const payload = await request.validateUsing(sendChatMessageValidator)
    const message = await new ChatService().sendToSchedule(
      membership,
      params.scheduleId,
      payload.body
    )
    return response.created(toChatMessage(message))
  }
}

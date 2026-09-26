import type ChatMessage from '#models/chat_message'

export function toChatMessage(message: ChatMessage) {
  return {
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toUTC().toISO(),
    author: {
      membershipId: message.membershipId,
      name: message.membership.user.name,
    },
  }
}

import { ChatPanel } from '../components/ChatPanel.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

export function ChatPage() {
  const { ministry } = useMinistry()

  return (
    <section>
      <h1>Mensagens</h1>
      <p className="eyebrow">{ministry.name}</p>
      <ChatPanel path={`/api/ministerios/${ministry.id}/chat`} timeZone={ministry.timezone} />
    </section>
  )
}

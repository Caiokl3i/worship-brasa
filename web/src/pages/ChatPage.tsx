import { ChatPanel } from '../components/ChatPanel.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

export function ChatPage() {
  const { ministry } = useMinistry()

  return (
    <section className="page page-chat">
      <header className="page-header">
        <p className="eyebrow">{ministry.name}</p>
        <h1>Mensagens</h1>
      </header>
      <ChatPanel path={`/api/ministerios/${ministry.id}/chat`} timeZone={ministry.timezone} />
    </section>
  )
}

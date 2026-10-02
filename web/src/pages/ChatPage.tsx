import { ChatPanel } from '../components/ChatPanel.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

export function ChatPage() {
  const { ministry } = useMinistry()

  return (
    <section className="page page-chat chat-screen">
      <header className="song-top">
        <span />
        <div className="repertoire-heading">
          <h1>Mensagens</h1>
          <p>{ministry.name}</p>
        </div>
        <span />
      </header>
      <ChatPanel
        path={`/api/ministerios/${ministry.id}/chat`}
        timeZone={ministry.timezone}
        membershipId={ministry.membership.id}
      />
    </section>
  )
}

import { Link } from 'react-router-dom'
import { ChatPanel } from '../components/ChatPanel.tsx'
import { useMinistry } from '../layouts/MinistryLayout.tsx'

export function ChatPage() {
  const { ministry } = useMinistry()

  return (
    <section>
      <p className="eyebrow">Ministério</p>
      <h1>Chat</h1>
      <p>
        <Link to={`/m/${ministry.id}`}>Voltar</Link>
      </p>
      <ChatPanel path={`/api/ministerios/${ministry.id}/chat`} timeZone={ministry.timezone} />
    </section>
  )
}

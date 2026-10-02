import { useEffect, useRef, useState } from 'react'
import { fieldMessage } from './FieldErrors.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { mergeMessages, type ChatMessageItem, type ChatPage } from '../lib/chat.ts'

const REFRESH_MS = 4000

export function ChatPanel({
  path,
  timeZone,
  membershipId,
}: {
  path: string
  timeZone: string
  membershipId: string
}) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')
  const threadRef = useRef<HTMLOListElement>(null)
  const newestId = messages.at(-1)?.id

  useEffect(() => {
    const thread = threadRef.current
    if (!thread) {
      return
    }
    thread.scrollTop = thread.scrollHeight
  }, [newestId])

  useEffect(() => {
    let cancelled = false
    let opened = false

    async function refresh() {
      try {
        const page = await api<ChatPage>(path)
        if (cancelled) {
          return
        }
        if (!opened) {
          opened = true
          setMessages(page.messages)
          setHasMore(page.hasMore)
          return
        }
        setMessages((current) => mergeMessages(current, page.messages))
      } catch (error) {
        if (cancelled || !(error instanceof ApiError)) {
          return
        }
        setNotice(error.message)
      }
    }

    void refresh()
    const timer = window.setInterval(() => void refresh(), REFRESH_MS)
    window.addEventListener('focus', refresh)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
    }
  }, [path])

  async function older() {
    const oldest = messages[0]
    if (!oldest) {
      return
    }
    const page = await api<ChatPage>(`${path}?before=${oldest.id}`)
    setMessages((current) => mergeMessages(current, page.messages))
    setHasMore(page.hasMore)
  }

  async function send(event: React.FormEvent) {
    event.preventDefault()
    setErrors([])
    setNotice('')
    try {
      const created = await api<ChatMessageItem>(path, {
        method: 'POST',
        body: JSON.stringify({ body }),
      })
      setMessages((current) => mergeMessages(current, [created]))
      setBody('')
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.errors)
        setNotice(error.message)
        return
      }
      throw error
    }
  }

  return (
    <div className="chat-panel">
      {notice ? <p className="notice">{notice}</p> : null}
      {hasMore ? (
        <button type="button" className="button-outline" onClick={() => void older()}>
          Mensagens anteriores
        </button>
      ) : null}
      <ol className="chat-thread" ref={threadRef}>
        {messages.map((message) => {
          const mine = message.author.membershipId === membershipId
          const firstName = message.author.name.trim().split(/\s+/)[0] || message.author.name
          return (
            <li key={message.id} className={mine ? 'chat-bubble is-mine' : 'chat-bubble'}>
              <header>
                <strong>{firstName}</strong>
                <span>{chatClock(message.createdAt, timeZone)}</span>
              </header>
              <p>{message.body}</p>
            </li>
          )
        })}
      </ol>
      <form className="chat-compose" onSubmit={(event) => void send(event)}>
        <input
          name="body"
          value={body}
          placeholder="Digite aqui..."
          onChange={(event) => setBody(event.target.value)}
        />
        <button type="submit">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 2 11 13" />
            <path d="m22 2-7 20-4-9-9-4 20-7z" />
          </svg>
          Enviar
        </button>
        {fieldMessage(errors, 'body') ? <small className="song-error">{fieldMessage(errors, 'body')}</small> : null}
      </form>
    </div>
  )
}

function chatClock(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

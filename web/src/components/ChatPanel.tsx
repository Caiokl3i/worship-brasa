import { useEffect, useState } from 'react'
import { fieldMessage } from './FieldErrors.tsx'
import { api, ApiError, type FieldError } from '../lib/api.ts'
import { mergeMessages, type ChatMessageItem, type ChatPage } from '../lib/chat.ts'
import { formatInZone } from '../lib/schedule.ts'

const REFRESH_MS = 4000

export function ChatPanel({ path, timeZone }: { path: string; timeZone: string }) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [body, setBody] = useState('')
  const [errors, setErrors] = useState<FieldError[]>([])
  const [notice, setNotice] = useState('')

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
    <div>
      {notice ? <p className="notice">{notice}</p> : null}
      {hasMore ? (
        <button type="button" onClick={() => void older()}>
          Mensagens anteriores
        </button>
      ) : null}
      {messages.length === 0 ? <p>Nenhuma mensagem.</p> : null}
      <ol className="list">
        {messages.map((message) => (
          <li key={message.id} className="card">
            <strong>{message.author.name}</strong>
            <span> {formatInZone(message.createdAt, timeZone)}</span>
            <p>{message.body}</p>
          </li>
        ))}
      </ol>
      <form className="form" onSubmit={(event) => void send(event)}>
        <label className="field">
          <span>Mensagem</span>
          <textarea name="body" value={body} onChange={(event) => setBody(event.target.value)} />
          {fieldMessage(errors, 'body') ? <small>{fieldMessage(errors, 'body')}</small> : null}
        </label>
        <button type="submit">Enviar</button>
      </form>
    </div>
  )
}

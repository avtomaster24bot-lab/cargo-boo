import { ChevronLeft, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatTime } from '../lib/format'
import { actions, useStore } from '../store'

const QUICK = ['Я на месте', 'Подъезжаю', 'Есть лифт?', 'Позвоните, пожалуйста', 'Ок, жду']

export function ChatScreen() {
  const { screen, orders, role } = useStore()
  const order = orders.find((o) => o.id === screen.orderId)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [order?.messages.length])

  if (!order) return null

  function send(value = text) {
    if (!order) return
    actions.sendMessage(order.id, value)
    setText('')
  }

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <header className="safe-top sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-cream px-3 py-2">
        <button
          type="button"
          onClick={() => actions.back()}
          className="grid h-10 w-10 place-items-center rounded-full bg-paper"
          aria-label="Назад"
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <p className="font-extrabold">Чат по заказу {order.shortId}</p>
          <p className="text-xs text-ink-soft">Демо-переписка сохраняется в браузере</p>
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {order.messages.map((m) => {
          if (m.author === 'system') {
            return (
              <p key={m.id} className="px-6 text-center text-[11px] text-ink-soft">
                {m.text} · {formatTime(m.createdAt)}
              </p>
            )
          }
          const mine =
            (role === 'driver' && m.author === 'driver') || (role !== 'driver' && m.author === 'client')
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                  mine ? 'rounded-br-md bg-teal text-white' : 'rounded-bl-md bg-paper'
                }`}
              >
                {m.text}
                <div className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-ink-soft'}`}>
                  {formatTime(m.createdAt)}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      <div className="safe-bottom border-t border-line bg-paper px-3 pt-2">
        <div className="hide-scrollbar mb-2 flex gap-2 overflow-x-auto">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className="shrink-0 rounded-full bg-cream px-3 py-1.5 text-xs font-bold"
            >
              {q}
            </button>
          ))}
        </div>
        <form
          className="flex items-center gap-2 pb-2"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Сообщение"
            className="h-11 flex-1 rounded-2xl border border-line bg-cream px-3 outline-none focus:border-teal"
          />
          <button type="submit" className="grid h-11 w-11 place-items-center rounded-2xl bg-teal text-white" aria-label="Отправить">
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  )
}

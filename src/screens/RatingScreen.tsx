import { Star } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { resolveDriver } from '../lib/drivers'
import { tenge } from '../lib/format'
import { actions, useStore } from '../store'

export function RatingScreen() {
  const { screen, orders } = useStore()
  const order = orders.find((o) => o.id === screen.orderId)
  const [stars, setStars] = useState(order?.rating?.stars ?? 5)
  const [comment, setComment] = useState(order?.rating?.comment ?? '')
  if (!order) return null
  const driver = resolveDriver(order.assignedDriverId)
  const locked = Boolean(order.rating)

  return (
    <div className="flex min-h-full flex-col bg-cream px-5 pb-8 pt-16">
      <p className="text-center text-sm font-bold text-ink-soft">Заказ {order.shortId} доставлен</p>
      <h1 className="font-display mt-1 text-center text-2xl font-extrabold">Как прошла перевозка?</h1>
      {driver && (
        <div className="mt-6 flex flex-col items-center">
          <Avatar name={driver.name} hue={driver.hue} size={72} />
          <p className="mt-2 font-extrabold">{driver.name}</p>
          <p className="text-sm text-ink-soft">{tenge(order.agreedPrice ?? order.clientPrice)}</p>
        </div>
      )}
      <div className="mt-6 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={locked}
            onClick={() => setStars(n)}
            aria-label={`${n} из 5`}
          >
            <Star size={36} className={n <= stars ? 'fill-amber text-amber' : 'text-line'} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        disabled={locked}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Комментарий, если хотите"
        rows={3}
        className="mt-6 w-full resize-none rounded-2xl border border-line bg-paper px-3 py-2 outline-none focus:border-teal"
      />
      {locked ? (
        <button type="button" className="cta mt-6" onClick={() => actions.go({ name: 'home' }, true)}>
          На главную
        </button>
      ) : (
        <button type="button" className="cta mt-6" onClick={() => actions.rateOrder(order.id, stars, comment)}>
          Отправить оценку
        </button>
      )}
    </div>
  )
}

import { ChevronLeft, MessageCircle, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import { MapView } from '../components/MapView'
import { StatusBadge } from '../components/StatusBadge'
import { vehicleById } from '../data/vehicles'
import { formatDateTime, km, tenge } from '../lib/format'
import { NEXT_STATUS_LABEL } from '../lib/status'
import { isSubscriptionActive } from '../lib/subscription'
import { actions, useStore } from '../store'

export function DriverOrderScreen() {
  const { screen, orders, subscription } = useStore()
  const order = orders.find((o) => o.id === screen.orderId)
  const [price, setPrice] = useState(order?.clientPrice ?? 0)
  if (!order) return null
  const v = vehicleById(order.vehicleId)
  const nextLabel = NEXT_STATUS_LABEL[order.status]
  const searching = order.status === 'searching'
  const canTake = isSubscriptionActive(subscription)

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <MapView className="h-[30vh] shrink-0" pickup={order.pickup} dropoff={order.dropoff} route={order.route} />
      <header className="safe-top absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3">
        <button
          type="button"
          onClick={() => actions.back()}
          className="grid h-10 w-10 place-items-center rounded-full bg-paper shadow"
          aria-label="Назад"
        >
          <ChevronLeft size={22} />
        </button>
        <StatusBadge status={order.status} />
      </header>

      <div className="sheet relative -mt-5 flex-1 px-4 pb-8 pt-5">
        <p className="text-xs font-bold text-ink-soft">
          {order.shortId} · {formatDateTime(order.createdAt)} · {v.emoji} {v.name} · {km(order.distanceKm)}
        </p>
        <h1 className="font-display mt-1 text-2xl font-extrabold">
          {tenge(order.agreedPrice ?? order.clientPrice)}
        </h1>
        <p className="mt-3 text-sm leading-snug">
          <span className="font-bold text-teal-dark">A</span> {order.pickup.address}
        </p>
        <p className="mt-1 text-sm leading-snug">
          <span className="font-bold text-coral">B</span> {order.dropoff.address}
        </p>
        {order.cargoDescription && <p className="mt-3 text-sm text-ink-soft">{order.cargoDescription}</p>}
        {order.cargoPhoto && (
          <img src={order.cargoPhoto} alt="Груз" className="mt-3 h-32 w-full rounded-2xl object-cover" />
        )}
        <p className="mt-3 text-xs text-ink-soft">
          Грузчики: {order.options.loaders}
          {order.options.packaging ? ' · упаковка' : ''}
          {order.options.insurance ? ' · страховка' : ''}
          {order.options.urgent ? ' · срочно' : ''}
        </p>

        {searching && !canTake && (
          <div className="card mt-5 p-4">
            <p className="font-extrabold">Нужен абонемент</p>
            <p className="mt-1 text-sm text-ink-soft">
              Без активной подписки нельзя принять заказ или предложить свою цену.
            </p>
            <button type="button" className="cta mt-3" onClick={() => actions.go({ name: 'tariffs' })}>
              Оформить абонемент
            </button>
          </div>
        )}

        {searching && canTake && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-2xl bg-cream"
                onClick={() => setPrice((p) => Math.max(100, p - 500))}
              >
                <Minus size={18} />
              </button>
              <div className="flex-1 text-center text-xl font-extrabold">{tenge(price)}</div>
              <button
                type="button"
                className="grid h-11 w-11 place-items-center rounded-2xl bg-cream"
                onClick={() => setPrice((p) => p + 500)}
              >
                <Plus size={18} />
              </button>
            </div>
            <button type="button" className="cta" onClick={() => actions.takeOrder(order.id, price)}>
              Принять за {tenge(price)}
            </button>
            <button
              type="button"
              className="cta cta-navy"
              onClick={() => {
                actions.driverOffer(order.id, price, 'counter')
                actions.go({ name: 'driver' }, true)
              }}
            >
              Предложить {tenge(price)} и ждать
            </button>
          </div>
        )}

        {!searching && nextLabel && (
          <button type="button" className="cta mt-5" onClick={() => actions.advanceStatus(order.id)}>
            {nextLabel}
          </button>
        )}

        {!searching && (
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-cream py-3 font-bold"
            onClick={() => actions.go({ name: 'chat', orderId: order.id })}
          >
            <MessageCircle size={18} /> Чат с клиентом
          </button>
        )}
      </div>
    </div>
  )
}

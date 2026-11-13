import { MapPin } from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { vehicleById } from '../data/vehicles'
import { formatDateTime, km, minutes, tenge } from '../lib/format'
import { actions, useStore } from '../store'

export function DriverHomeScreen() {
  const { orders, name } = useStore()
  const self = actions.demoSelfDriverId()
  const mine = orders.filter(
    (o) =>
      o.assignedDriverId === self &&
      o.status !== 'cancelled' &&
      o.status !== 'rated' &&
      o.status !== 'delivered',
  )
  const nearby = orders.filter((o) => o.status === 'searching')

  return (
    <div className="flex min-h-full flex-col bg-cream px-4 pb-8">
      <header className="safe-top py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-dark">Режим водителя</p>
        <h1 className="font-display text-2xl font-extrabold">{name || 'Водитель'}, рядом заказы</h1>
        <p className="text-sm text-ink-soft">Алматы · можно принять или предложить свою цену</p>
      </header>

      {mine.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-2 text-xs font-bold uppercase text-ink-soft">Активные</h2>
          {mine.map((order) => (
            <button
              key={order.id}
              type="button"
              onClick={() => actions.openOrder(order.id)}
              className="card mb-2 w-full p-3 text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{order.shortId}</span>
                <StatusBadge status={order.status} />
              </div>
              <p className="mt-1 font-extrabold">{tenge(order.agreedPrice ?? order.clientPrice)}</p>
              <p className="truncate text-sm">{order.pickup.address}</p>
            </button>
          ))}
        </section>
      )}

      <h2 className="mb-2 text-xs font-bold uppercase text-ink-soft">Доступны рядом</h2>
      {nearby.length === 0 && (
        <div className="card p-5 text-sm leading-relaxed text-ink-soft">
          Пока нет открытых заказов. Переключитесь в режим клиента, оформите перевозку — и она
          появится в этом списке.
        </div>
      )}
      <div className="space-y-2">
        {nearby.map((order) => {
          const v = vehicleById(order.vehicleId)
          return (
            <button
              key={order.id}
              type="button"
              onClick={() => actions.openOrder(order.id)}
              className="card w-full p-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-extrabold">{tenge(order.clientPrice)}</span>
                <span className="text-xs font-bold text-ink-soft">
                  {v.emoji} {v.name} · {km(order.distanceKm)} · {minutes(order.durationMin)}
                </span>
              </div>
              <p className="mt-2 flex items-start gap-2 text-sm">
                <MapPin size={14} className="mt-0.5 text-teal-dark" />
                <span className="truncate">{order.pickup.address}</span>
              </p>
              <p className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="mt-0.5 text-coral" />
                <span className="truncate">{order.dropoff.address}</span>
              </p>
              <p className="mt-1 text-[11px] text-ink-soft">{formatDateTime(order.createdAt)}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

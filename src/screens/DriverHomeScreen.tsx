import { MapPin } from 'lucide-react'
import { StatusBadge } from '../components/StatusBadge'
import { vehicleById } from '../data/vehicles'
import { formatDate, formatDateTime, km, minutes, tenge } from '../lib/format'
import { isSubscriptionActive, kindLabel, remainingLabel, shouldRemind } from '../lib/subscription'
import { actions, useStore } from '../store'

export function DriverHomeScreen() {
  const { orders, name, subscription } = useStore()
  const self = actions.demoSelfDriverId()
  const active = isSubscriptionActive(subscription)
  const remind = shouldRemind(subscription)
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
        <button
          type="button"
          onClick={() => actions.go({ name: 'tariffs' })}
          className={`mt-3 w-full rounded-2xl px-3 py-3 text-left ${
            active ? (remind ? 'bg-amber-100' : 'bg-mint') : 'bg-red-50'
          }`}
        >
          {active ? (
            <>
              <p className={`text-sm font-extrabold ${remind ? 'text-amber-800' : 'text-teal-dark'}`}>
                {kindLabel(subscription.kind)}: {remainingLabel(subscription.expiresAt)}
              </p>
              {subscription.expiresAt && (
                <p className={`text-xs ${remind ? 'text-amber-800' : 'text-ink-soft'}`}>
                  {remind
                    ? `Истекает ${formatDate(subscription.expiresAt)} — продлите, чтобы не потерять заказы`
                    : `До ${formatDate(subscription.expiresAt)}. Открыть тарифы`}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-extrabold text-coral">Нет активного абонемента</p>
              <p className="text-xs text-ink-soft">Оформите тариф, чтобы принимать заказы</p>
            </>
          )}
        </button>
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
      <div className="relative">
        <div className={`space-y-2 ${active ? '' : 'pointer-events-none blur-sm'}`}>
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
        {!active && nearby.length > 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="card max-w-xs p-4 text-center shadow-lg">
              <p className="font-extrabold">Заказы закрыты</p>
              <p className="mt-1 text-sm text-ink-soft">
                Оформите абонемент или дождитесь пробного периода, чтобы принимать заявки.
              </p>
              <button type="button" className="cta mt-3" onClick={() => actions.go({ name: 'tariffs' })}>
                Оформить абонемент
              </button>
            </div>
          </div>
        )}
        {!active && nearby.length === 0 && (
          <button type="button" className="cta mt-4" onClick={() => actions.go({ name: 'tariffs' })}>
            Оформить абонемент
          </button>
        )}
      </div>
    </div>
  )
}

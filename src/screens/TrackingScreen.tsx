import { ChevronLeft, MessageCircle, Phone, Star } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { MapView } from '../components/MapView'
import { StatusBadge } from '../components/StatusBadge'
import { resolveDriver } from '../lib/drivers'
import { formatDateTime, km, minutes, tenge } from '../lib/format'
import { STATUS_LABELS, TIMELINE, statusIndex } from '../lib/status'
import { vehicleById } from '../data/vehicles'
import { actions, useStore } from '../store'

const PAY = { cash: 'Наличные', card: 'Карта', kaspi: 'Kaspi' } as const

export function TrackingScreen() {
  const { screen, orders, role } = useStore()
  const order = orders.find((o) => o.id === screen.orderId)
  if (!order) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <button type="button" className="cta max-w-xs" onClick={() => actions.go({ name: 'home' }, true)}>
          На главную
        </button>
      </div>
    )
  }
  const driver = resolveDriver(order.assignedDriverId)
  const vehicle = vehicleById(order.vehicleId)
  const idx = statusIndex(order.status)
  const done = order.status === 'delivered' || order.status === 'rated' || order.status === 'cancelled'

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <MapView
        className="h-[32vh] shrink-0"
        pickup={order.pickup}
        dropoff={order.dropoff}
        route={order.route}
        drivers={driver ? [driver] : []}
      />
      <header className="safe-top absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3">
        <button
          type="button"
          onClick={() => actions.go({ name: role === 'driver' ? 'driver' : 'home' }, true)}
          className="grid h-10 w-10 place-items-center rounded-full bg-paper shadow"
          aria-label="Назад"
        >
          <ChevronLeft size={22} />
        </button>
        <StatusBadge status={order.status} />
      </header>

      <div className="sheet relative -mt-5 flex-1 px-4 pb-8 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-ink-soft">{order.shortId} · {formatDateTime(order.createdAt)}</p>
            <h1 className="font-display text-xl font-bold">{tenge(order.agreedPrice ?? order.clientPrice)}</h1>
            <p className="text-xs text-ink-soft">
              {vehicle.emoji} {vehicle.name} · {km(order.distanceKm)} · {PAY[order.payment]}
            </p>
          </div>
        </div>

        {driver && (
          <div className="card mt-4 flex items-center gap-3 p-3">
            <Avatar name={driver.name} hue={driver.hue} size={52} />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold">{driver.name}</p>
              <p className="text-xs text-ink-soft">
                ★ {driver.rating.toFixed(2)} · {driver.plate} · {minutes(10)} до подачи
              </p>
            </div>
            <a
              href={`tel:${driver.phone.replace(/\s/g, '')}`}
              className="grid h-10 w-10 place-items-center rounded-full bg-mint text-teal-dark"
              aria-label="Позвонить"
            >
              <Phone size={18} />
            </a>
            <button
              type="button"
              onClick={() => actions.go({ name: 'chat', orderId: order.id })}
              className="grid h-10 w-10 place-items-center rounded-full bg-cream"
              aria-label="Чат"
            >
              <MessageCircle size={18} />
            </button>
          </div>
        )}

        <ol className="mt-5 space-y-3">
          {TIMELINE.map((st, i) => {
            const reached = idx >= i && idx !== -1
            const current = order.status === st
            return (
              <li key={st} className="flex items-center gap-3">
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-extrabold ${
                    reached ? 'bg-teal text-white' : 'bg-line text-ink-soft'
                  }`}
                >
                  {i + 1}
                </span>
                <span className={`text-sm ${current ? 'font-extrabold' : reached ? 'font-semibold' : 'text-ink-soft'}`}>
                  {STATUS_LABELS[st]}
                </span>
              </li>
            )
          })}
        </ol>

        <div className="card mt-5 p-3 text-sm leading-snug">
          <p>
            <span className="font-bold text-teal-dark">A</span> {order.pickup.address}
          </p>
          <p className="mt-2">
            <span className="font-bold text-coral">B</span> {order.dropoff.address}
          </p>
          {order.cargoDescription && <p className="mt-2 text-ink-soft">{order.cargoDescription}</p>}
          {order.cargoPhoto && (
            <img src={order.cargoPhoto} alt="Груз" className="mt-2 h-28 w-full rounded-2xl object-cover" />
          )}
        </div>

        {order.status === 'delivered' && (
          <button type="button" className="cta mt-4" onClick={() => actions.go({ name: 'rating', orderId: order.id })}>
            <Star size={18} className="mr-2" /> Оценить поездку
          </button>
        )}

        {!done && (
          <button
            type="button"
            className="mt-4 w-full py-3 text-sm font-bold text-ink-soft"
            onClick={() => actions.cancelOrder(order.id)}
          >
            Отменить заказ
          </button>
        )}
      </div>
    </div>
  )
}

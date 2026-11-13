import { StatusBadge } from '../components/StatusBadge'
import { vehicleById } from '../data/vehicles'
import { formatDateTime, km, tenge } from '../lib/format'
import { actions, useStore } from '../store'

export function HistoryScreen() {
  const { orders, role } = useStore()
  const self = actions.demoSelfDriverId()
  const list =
    role === 'driver'
      ? orders.filter((o) => o.assignedDriverId === self || o.status === 'searching')
      : orders

  return (
    <div className="flex min-h-full flex-col bg-cream px-4 pb-8">
      <header className="safe-top py-4">
        <h1 className="font-display text-2xl font-extrabold">{role === 'driver' ? 'Мои заказы' : 'История'}</h1>
        <p className="text-sm text-ink-soft">Всё хранится в этом браузере</p>
      </header>
      {list.length === 0 && (
        <div className="card p-6 text-center text-sm text-ink-soft">
          Пока пусто. {role === 'driver' ? 'Примите заказ на вкладке «Заказы».' : 'Оформите первую перевозку — она появится здесь.'}
        </div>
      )}
      <div className="space-y-2">
        {list.map((order) => {
          const v = vehicleById(order.vehicleId)
          return (
            <button
              key={order.id}
              type="button"
              onClick={() => actions.openOrder(order.id)}
              className="card flex w-full flex-col gap-1 p-3 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink-soft">
                  {order.shortId} · {formatDateTime(order.createdAt)}
                </span>
                <StatusBadge status={order.status} />
              </div>
              <p className="truncate text-sm font-semibold">{order.pickup.address}</p>
              <p className="truncate text-sm font-semibold">{order.dropoff.address}</p>
              <p className="text-xs text-ink-soft">
                {v.emoji} {v.name} · {km(order.distanceKm)} · {tenge(order.agreedPrice ?? order.clientPrice)}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

import { ChevronLeft } from 'lucide-react'
import { MapView } from '../components/MapView'
import { Avatar } from '../components/Avatar'
import { resolveDriver } from '../lib/drivers'
import { minutes, tenge } from '../lib/format'
import { actions, useStore } from '../store'

export function SearchScreen() {
  const { screen, orders } = useStore()
  const order = orders.find((o) => o.id === screen.orderId)
  if (!order) {
    return (
      <Empty onBack={() => actions.go({ name: 'home' }, true)} title="Заказ не найден" />
    )
  }

  const offers = [...order.offers].sort((a, b) => a.price - b.price)

  return (
    <div className="relative flex min-h-full flex-col bg-cream">
      <MapView
        className="h-[38vh] shrink-0"
        pickup={order.pickup}
        dropoff={order.dropoff}
        route={order.route}
      />
      <header className="safe-top absolute inset-x-0 top-0 z-10 flex items-center gap-2 px-3">
        <button
          type="button"
          onClick={() => actions.go({ name: 'home' }, true)}
          className="grid h-10 w-10 place-items-center rounded-full bg-paper shadow"
          aria-label="Назад"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="rounded-full bg-paper/95 px-3 py-2 text-sm font-bold shadow">{order.shortId}</div>
      </header>

      <div className="sheet relative -mt-4 flex-1 px-4 pb-6 pt-4">
        <div className="flex items-center gap-2">
          <span className="pulse-dot" />
          <div>
            <h1 className="font-display text-lg font-bold">Ищем водителя</h1>
            <p className="text-xs text-ink-soft">
              Ваша цена {tenge(order.clientPrice)}. Водители отвечают прямо сейчас.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {offers.length === 0 && (
            <div className="card p-4 text-sm text-ink-soft">
              Обычно первые предложения приходят за несколько секунд. Можно подождать или отменить
              заказ.
            </div>
          )}
          {offers.map((offer) => {
            const driver = resolveDriver(offer.driverId)
            if (!driver) return null
            return (
              <div key={offer.id} className="card flex items-center gap-3 p-3">
                <Avatar name={driver.name} hue={driver.hue} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{driver.name}</p>
                  <p className="text-xs text-ink-soft">
                    ★ {driver.rating.toFixed(2)} · {driver.trips} поездок · {minutes(offer.etaMin)}
                  </p>
                  <p className="text-xs font-semibold text-ink-soft">
                    {offer.kind === 'counter' ? 'Встречное предложение' : 'Готов взять вашу цену'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-extrabold">{tenge(offer.price)}</div>
                  <button
                    type="button"
                    className="mt-1 rounded-xl bg-teal px-3 py-1.5 text-xs font-extrabold text-white"
                    onClick={() => actions.acceptOffer(order.id, offer.id)}
                  >
                    Принять
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          className="mt-6 w-full rounded-2xl py-3 text-sm font-bold text-ink-soft"
          onClick={() => actions.cancelOrder(order.id)}
        >
          Отменить заказ
        </button>
      </div>
    </div>
  )
}

function Empty({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3 p-8">
      <p className="font-bold">{title}</p>
      <button type="button" className="cta max-w-xs" onClick={onBack}>
        На главную
      </button>
    </div>
  )
}

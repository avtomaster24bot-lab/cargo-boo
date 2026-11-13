import { ArrowLeftRight, ChevronRight, Clock, MapPin, Navigation } from 'lucide-react'
import { DRIVERS } from '../data/drivers'
import { PLACES } from '../data/places'
import { VEHICLES } from '../data/vehicles'
import { MapView } from '../components/MapView'
import { formatTime, km, minutes, tenge } from '../lib/format'
import { actions, useStore } from '../store'

export function HomeScreen() {
  const { draft, name } = useStore()
  const ready = Boolean(draft.pickup && draft.dropoff && draft.estimatedPrice > 0)
  const routing = draft.routing === 'loading'

  function swap() {
    actions.patchDraft({ pickup: draft.dropoff, dropoff: draft.pickup })
  }

  function demoRoute() {
    actions.patchDraft({ pickup: PLACES[4], dropoff: PLACES[5] })
  }

  const cta = !draft.pickup
    ? 'Укажите, откуда забрать'
    : !draft.dropoff
      ? 'Укажите, куда везём'
      : routing
        ? 'Считаем маршрут…'
        : ready
          ? `Заказать за ${tenge(draft.clientPrice || draft.estimatedPrice)}`
          : 'Заказать'

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <MapView
        className="absolute inset-0"
        pickup={draft.pickup}
        dropoff={draft.dropoff}
        route={draft.route}
        drivers={DRIVERS}
      />

      <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between px-4">
        <div className="pointer-events-auto rounded-3xl bg-navy/90 px-4 py-3 text-white shadow-lg backdrop-blur">
          <p className="font-display text-lg font-bold leading-none">Карго Боо</p>
          <p className="mt-1 text-[11px] text-white/70">
            {name ? `Привет, ${name}` : 'Грузы по Алматы'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => actions.go({ name: 'profile' }, true)}
          className="pointer-events-auto rounded-full bg-paper/95 px-3 py-2 text-xs font-bold text-navy shadow"
        >
          Профиль
        </button>
      </header>

      <div className="sheet relative z-10 mt-auto px-4 pb-4 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <div className="card overflow-hidden">
          <button
            type="button"
            onClick={() => actions.go({ name: 'address', addressTarget: 'pickup' })}
            className="flex w-full items-center gap-3 px-3 py-3 text-left"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-mint text-teal-dark">
              <MapPin size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                Откуда
              </span>
              <span className={`block truncate text-[15px] font-semibold ${draft.pickup ? 'text-ink' : 'text-ink-soft'}`}>
                {draft.pickup?.address ?? 'Адрес подачи'}
              </span>
            </span>
            <ChevronRight size={18} className="text-ink-soft" />
          </button>
          <div className="relative">
            <div className="mx-14 border-t border-line" />
            <button
              type="button"
              onClick={swap}
              className="absolute -top-4 right-3 grid h-8 w-8 place-items-center rounded-full border border-line bg-paper text-navy shadow-sm"
              aria-label="Поменять местами"
            >
              <ArrowLeftRight size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => actions.go({ name: 'address', addressTarget: 'dropoff' })}
            className="flex w-full items-center gap-3 px-3 py-3 text-left"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-red-50 text-coral">
              <Navigation size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                Куда
              </span>
              <span className={`block truncate text-[15px] font-semibold ${draft.dropoff ? 'text-ink' : 'text-ink-soft'}`}>
                {draft.dropoff?.address ?? 'Адрес выгрузки'}
              </span>
            </span>
            <ChevronRight size={18} className="text-ink-soft" />
          </button>
        </div>

        <div className="hide-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          {VEHICLES.map((v) => {
            const on = draft.vehicleId === v.id
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => actions.setVehicle(v.id)}
                className={`min-w-[92px] shrink-0 rounded-2xl border px-3 py-2.5 text-left ${
                  on ? 'border-teal bg-mint shadow-sm' : 'border-line bg-paper'
                }`}
              >
                <div className="text-lg leading-none">{v.emoji}</div>
                <div className="mt-1 text-[13px] font-extrabold">{v.name}</div>
                <div className="text-[10px] text-ink-soft">{v.capacity.split(',')[0]}</div>
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <button type="button" onClick={demoRoute} className="text-xs font-bold text-teal-dark">
            Демо-маршрут
          </button>
          {draft.distanceKm > 0 && (
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-soft">
              <Clock size={14} />
              {km(draft.distanceKm)} · {minutes(draft.durationMin)}
              {draft.options.timeMode === 'scheduled' && draft.options.scheduledAt && (
                <span>· к {formatTime(draft.options.scheduledAt)}</span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="cta mt-3"
          disabled={!ready || routing}
          onClick={() => actions.go({ name: 'confirm' })}
        >
          {cta}
        </button>
      </div>
    </div>
  )
}

import { ChevronLeft, Loader2, MapPin, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PLACES } from '../data/places'
import { MapView } from '../components/MapView'
import { reverseGeocode, searchAddress } from '../lib/geo'
import { actions, useStore } from '../store'
import type { GeoPoint } from '../types'

export function AddressScreen() {
  const { screen, draft } = useStore()
  const target = screen.addressTarget ?? 'pickup'
  const current = target === 'pickup' ? draft.pickup : draft.dropoff
  const [query, setQuery] = useState(current?.address ?? '')
  const [results, setResults] = useState<GeoPoint[]>([])
  const [searching, setSearching] = useState(false)
  const [pin, setPin] = useState<GeoPoint | null>(current)
  const [geoLoading, setGeoLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      return
    }
    const ctrl = new AbortController()
    const t = window.setTimeout(() => {
      setSearching(true)
      void searchAddress(q, ctrl.signal)
        .then((items) => setResults(items))
        .catch(() => setResults([]))
        .finally(() => setSearching(false))
    }, 400)
    return () => {
      window.clearTimeout(t)
      ctrl.abort()
    }
  }, [query])

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PLACES
    return PLACES.filter((p) => p.address.toLowerCase().includes(q))
  }, [query])

  async function dropPin(lat: number, lng: number) {
    setGeoLoading(true)
    setPin({ lat, lng, address: 'Определяем адрес…' })
    const address = await reverseGeocode(lat, lng)
    setPin({ lat, lng, address })
    setQuery(address)
    setGeoLoading(false)
  }

  function apply(point: GeoPoint) {
    if (target === 'pickup') actions.patchDraft({ pickup: point })
    else actions.patchDraft({ dropoff: point })
    actions.back()
  }

  function confirm() {
    if (pin && pin.address && !geoLoading) apply(pin)
  }

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <header className="safe-top z-20 bg-cream px-3 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => actions.back()}
            className="grid h-10 w-10 place-items-center rounded-full bg-paper"
            aria-label="Назад"
          >
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft">
              {target === 'pickup' ? 'Откуда забрать' : 'Куда везём'}
            </p>
            <div className="relative mt-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Улица, дом, ТРЦ, аэропорт"
                autoFocus
                className="w-full rounded-2xl border border-line bg-paper py-3 pl-9 pr-3 outline-none focus:border-teal"
              />
            </div>
          </div>
        </div>
      </header>

      {(results.length > 0 || suggestions.length > 0) && (
        <div className="z-20 max-h-48 overflow-y-auto bg-cream px-3 pb-2">
          {searching && (
            <p className="flex items-center gap-2 px-2 py-2 text-xs text-ink-soft">
              <Loader2 size={14} className="animate-spin" /> Ищем адрес…
            </p>
          )}
          {(results.length > 0 ? results : suggestions).map((p) => (
            <button
              key={`${p.lat}-${p.lng}-${p.address}`}
              type="button"
              onClick={() => {
                setPin(p)
                setQuery(p.address)
                setResults([])
              }}
              className="flex w-full items-start gap-3 rounded-2xl px-2 py-2.5 text-left hover:bg-paper"
            >
              <MapPin size={16} className="mt-0.5 text-teal-dark" />
              <span className="text-sm font-medium leading-snug">{p.address}</span>
            </button>
          ))}
        </div>
      )}

      <MapView className="min-h-[240px] flex-1" pickup={pin} onMapClick={(lat, lng) => void dropPin(lat, lng)} />

      <div className="sheet z-20 px-4 pb-6 pt-4">
        <p className="text-sm font-semibold leading-snug">{pin?.address ?? 'Поставьте точку на карте или выберите адрес'}</p>
        <p className="mt-1 text-xs text-ink-soft">Можно ткнуть в карту — адрес подставится сам.</p>
        <button type="button" className="cta mt-4" disabled={!pin || geoLoading} onClick={confirm}>
          {target === 'pickup' ? 'Забрать здесь' : 'Везти сюда'}
        </button>
      </div>
    </div>
  )
}

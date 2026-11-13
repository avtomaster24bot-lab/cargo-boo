import type { ReactNode } from 'react'
import { Camera, ChevronLeft, Clock, Minus, Plus, Shield, Trash2, Users } from 'lucide-react'
import { vehicleById } from '../data/vehicles'
import { compressImage } from '../lib/image'
import { estimatePrice, INSURANCE_MIN, LOADER_FEE, PACKAGING_FEE } from '../lib/pricing'
import { km, minutes, tenge } from '../lib/format'
import { actions, useStore } from '../store'
import type { PaymentMethod } from '../types'

const PAYMENTS: { id: PaymentMethod; label: string; hint: string }[] = [
  { id: 'cash', label: 'Наличные', hint: 'Водителю при встрече' },
  { id: 'card', label: 'Карта', hint: 'Оплата позже, демо' },
  { id: 'kaspi', label: 'Kaspi', hint: 'Kaspi QR, демо' },
]

export function ConfirmScreen() {
  const { draft } = useStore()
  const vehicle = vehicleById(draft.vehicleId)
  const breakdown = estimatePrice(draft.vehicleId, draft.distanceKm, draft.options)
  const custom = draft.clientPrice > 0 && draft.clientPrice !== draft.estimatedPrice

  async function onPhoto(file: File | undefined) {
    if (!file) return
    const data = await compressImage(file)
    actions.patchDraft({ cargoPhoto: data })
  }

  return (
    <div className="flex min-h-full flex-col bg-cream">
      <header className="safe-top sticky top-0 z-10 flex items-center gap-2 bg-cream/95 px-3 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => actions.back()}
          className="grid h-10 w-10 place-items-center rounded-full bg-paper"
          aria-label="Назад"
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold">Оформление</h1>
          <p className="text-xs text-ink-soft">
            {vehicle.emoji} {vehicle.name} · {km(draft.distanceKm)} · {minutes(draft.durationMin)}
          </p>
        </div>
      </header>

      <div className="flex-1 space-y-3 px-4 pb-8">
        <div className="card p-3 text-sm leading-snug">
          <p>
            <span className="font-bold text-teal-dark">A</span> {draft.pickup?.address}
          </p>
          <p className="mt-2">
            <span className="font-bold text-coral">B</span> {draft.dropoff?.address}
          </p>
        </div>

        <div className="card p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Что везём</p>
          <textarea
            value={draft.cargoDescription}
            onChange={(e) => actions.patchDraft({ cargoDescription: e.target.value })}
            placeholder="Например: диван и 12 коробок, есть лифт"
            rows={3}
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-cream px-3 py-2 outline-none focus:border-teal"
          />
          <div className="mt-2 flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-mint px-3 py-2 text-sm font-bold text-teal-dark">
              <Camera size={16} />
              Фото груза
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => void onPhoto(e.target.files?.[0])}
              />
            </label>
            {draft.cargoPhoto && (
              <>
                <img src={draft.cargoPhoto} alt="Груз" className="h-12 w-12 rounded-xl object-cover" />
                <button type="button" onClick={() => actions.patchDraft({ cargoPhoto: undefined })} aria-label="Удалить фото">
                  <Trash2 size={16} className="text-ink-soft" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="card space-y-3 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Опции</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Users size={18} className="text-teal-dark" /> Грузчики
              <span className="text-xs font-medium text-ink-soft">{tenge(LOADER_FEE)} / чел.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full bg-cream"
                onClick={() => actions.patchOptions({ loaders: Math.max(0, draft.options.loaders - 1) })}
              >
                <Minus size={16} />
              </button>
              <span className="w-5 text-center font-extrabold">{draft.options.loaders}</span>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-full bg-cream"
                onClick={() => actions.patchOptions({ loaders: Math.min(6, draft.options.loaders + 1) })}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <Toggle
            on={draft.options.packaging}
            onChange={(on) => actions.patchOptions({ packaging: on })}
            label="Упаковка"
            hint={`+ ${tenge(PACKAGING_FEE)}`}
          />
          <Toggle
            on={draft.options.insurance}
            onChange={(on) => actions.patchOptions({ insurance: on })}
            label="Страховка груза"
            hint={`от ${tenge(INSURANCE_MIN)}`}
            icon={<Shield size={16} />}
          />
          <Toggle
            on={draft.options.urgent}
            onChange={(on) => actions.patchOptions({ urgent: on })}
            label="Срочно"
            hint="+ 30% к тарифу"
          />
          <div className="flex gap-2">
            <Chip
              on={draft.options.timeMode === 'now'}
              onClick={() => actions.patchOptions({ timeMode: 'now', scheduledAt: null })}
            >
              Сейчас
            </Chip>
            <label className={`flex flex-1 items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold ${draft.options.timeMode === 'scheduled' ? 'border-teal bg-mint' : 'border-line'}`}>
              <Clock size={16} />
              Ко времени
              <input
                type="datetime-local"
                className="min-w-0 flex-1 bg-transparent text-xs font-medium outline-none"
                value={draft.options.scheduledAt?.slice(0, 16) ?? ''}
                onChange={(e) =>
                  actions.patchOptions({
                    timeMode: e.target.value ? 'scheduled' : 'now',
                    scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </label>
          </div>
        </div>

        <div className="card p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Оплата</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PAYMENTS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => actions.setPayment(p.id)}
                className={`rounded-2xl border px-2 py-3 text-center ${
                  draft.payment === p.id
                    ? p.id === 'kaspi'
                      ? 'border-kaspi bg-red-50'
                      : 'border-teal bg-mint'
                    : 'border-line'
                }`}
              >
                <div className={`text-sm font-extrabold ${p.id === 'kaspi' ? 'text-kaspi' : ''}`}>{p.label}</div>
                <div className="mt-0.5 text-[10px] text-ink-soft">{p.hint}</div>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-soft">В этой версии оплата только выбирается, списания нет.</p>
        </div>

        <div className="card p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Цена и торг, как в inDrive</p>
          <div className="mt-2 space-y-1 text-sm">
            <Row label="Тариф авто" value={tenge(breakdown.body)} />
            {breakdown.loaders > 0 && <Row label="Грузчики" value={tenge(breakdown.loaders)} />}
            {breakdown.packaging > 0 && <Row label="Упаковка" value={tenge(breakdown.packaging)} />}
            {breakdown.insurance > 0 && <Row label="Страховка" value={tenge(breakdown.insurance)} />}
            {breakdown.urgent > 0 && <Row label="Срочность" value={tenge(breakdown.urgent)} />}
            <Row label="Оценка сервиса" value={tenge(breakdown.total)} bold />
          </div>
          <p className="mt-3 text-sm font-semibold">Предложите свою цену</p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-cream"
              onClick={() => actions.setClientPrice((draft.clientPrice || breakdown.total) - 500)}
            >
              <Minus size={18} />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={draft.clientPrice || breakdown.total}
              onChange={(e) => actions.setClientPrice(Number(e.target.value))}
              className="h-11 flex-1 rounded-2xl border border-line bg-cream text-center text-lg font-extrabold outline-none focus:border-teal"
            />
            <button
              type="button"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-cream"
              onClick={() => actions.setClientPrice((draft.clientPrice || breakdown.total) + 500)}
            >
              <Plus size={18} />
            </button>
          </div>
          {custom && (
            <p className="mt-2 text-xs font-semibold text-amber-700">
              Ваша цена {tenge(draft.clientPrice)}. Водители могут согласиться или прислать встречное
              предложение.
            </p>
          )}
        </div>

        <button type="button" className="cta" onClick={() => actions.placeOrder()}>
          Заказать за {tenge(draft.clientPrice || breakdown.total)}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? 'font-extrabold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function Toggle({
  on,
  onChange,
  label,
  hint,
  icon,
}: {
  on: boolean
  onChange: (on: boolean) => void
  label: string
  hint: string
  icon?: ReactNode
}) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex w-full items-center justify-between text-left">
      <span className="flex items-center gap-2 font-semibold">
        {icon}
        {label}
        <span className="text-xs font-medium text-ink-soft">{hint}</span>
      </span>
      <span className={`h-6 w-11 rounded-full p-0.5 transition ${on ? 'bg-teal' : 'bg-line'}`}>
        <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-2 text-sm font-bold ${on ? 'border-teal bg-mint' : 'border-line'}`}
    >
      {children}
    </button>
  )
}

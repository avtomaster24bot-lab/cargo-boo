import { ChevronLeft, CreditCard } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PLANS, type PlanId } from '../data/plans'
import { formatDate, formatDateTime, tenge } from '../lib/format'
import {
  isSubscriptionActive,
  kindLabel,
  remainingLabel,
  shouldRemind,
} from '../lib/subscription'
import { actions, useStore } from '../store'
import type { SubPayment, SubPaymentMethod } from '../types'

const METHODS: { id: SubPaymentMethod; label: string; hint: string }[] = [
  { id: 'kaspi', label: 'Kaspi', hint: 'Kaspi QR, демо' },
  { id: 'card', label: 'Карта', hint: 'Visa / Mastercard, демо' },
]

export function TariffsScreen() {
  const { subscription, payments } = useStore()
  const [planId, setPlanId] = useState<PlanId>('month')
  const [method, setMethod] = useState<SubPaymentMethod>('kaspi')
  const [phase, setPhase] = useState<'idle' | 'paying' | 'done'>('idle')
  const [lastPayment, setLastPayment] = useState<SubPayment | null>(null)
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[2]
  const active = isSubscriptionActive(subscription)
  const remind = shouldRemind(subscription)
  const spent = useMemo(
    () => payments.filter((p) => p.amount > 0).reduce((sum, p) => sum + p.amount, 0),
    [payments],
  )

  function pay() {
    setPhase('paying')
    window.setTimeout(() => {
      const payment = actions.paySubscription(planId, method)
      setLastPayment(payment)
      setPhase('done')
    }, 800)
  }

  return (
    <div className="flex min-h-full flex-col bg-cream px-4 pb-10">
      <header className="safe-top sticky top-0 z-10 flex items-center gap-2 bg-cream/95 py-2 backdrop-blur">
        <button
          type="button"
          onClick={() => actions.back()}
          className="grid h-10 w-10 place-items-center rounded-full bg-paper"
          aria-label="Назад"
        >
          <ChevronLeft size={22} />
        </button>
        <div>
          <h1 className="font-display text-lg font-bold">Тарифы водителя</h1>
          <p className="text-xs text-ink-soft">Абонемент, чтобы принимать заказы</p>
        </div>
      </header>

      <div className="card mt-3 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">Текущий статус</p>
        {active ? (
          <>
            <p className="mt-1 font-extrabold text-teal-dark">
              {kindLabel(subscription.kind)} · {remainingLabel(subscription.expiresAt)}
            </p>
            {subscription.expiresAt && (
              <p className="mt-1 text-sm text-ink-soft">
                Действует до {formatDate(subscription.expiresAt)}
                {subscription.kind === 'trial' ? ' · пробная неделя бесплатно' : ''}
              </p>
            )}
            {remind && subscription.expiresAt && (
              <p className="mt-2 rounded-2xl bg-amber-100 px-3 py-2 text-sm font-semibold text-amber-800">
                Абонемент истекает {formatDate(subscription.expiresAt)}. Продлите сейчас, чтобы не
                потерять доступ к заказам.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="mt-1 font-extrabold text-coral">Нет активной подписки</p>
            <p className="mt-1 text-sm text-ink-soft">
              {subscription.trialUsed
                ? 'Пробный период уже использован. Оформите абонемент, чтобы снова видеть и брать заказы.'
                : 'При первом входе в режим водителя откроется 7 дней бесплатно.'}
            </p>
          </>
        )}
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-soft">Выберите план</p>
      <div className="mt-2 space-y-2">
        {PLANS.map((item) => {
          const on = planId === item.id
          const perDay = Math.round(item.price / item.days)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setPlanId(item.id)
                setPhase('idle')
              }}
              className={`card relative w-full p-4 text-left ${on ? 'border-teal bg-mint shadow-sm' : ''}`}
            >
              {item.bestValue && (
                <span className="absolute right-3 top-3 rounded-full bg-amber px-2 py-0.5 text-[10px] font-extrabold text-navy">
                  Лучшая цена
                </span>
              )}
              <div className="flex items-end justify-between gap-3 pr-16">
                <div>
                  <p className="font-extrabold">{item.name}</p>
                  <p className="text-xs text-ink-soft">{item.hint}</p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold">{tenge(item.price)}</p>
                  <p className="text-[11px] text-ink-soft">{tenge(perDay)}/день</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-ink-soft">Оплата</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMethod(m.id)
              setPhase('idle')
            }}
            className={`rounded-2xl border px-3 py-3 text-left ${
              method === m.id
                ? m.id === 'kaspi'
                  ? 'border-kaspi bg-red-50'
                  : 'border-teal bg-mint'
                : 'border-line bg-paper'
            }`}
          >
            <p className={`font-extrabold ${m.id === 'kaspi' ? 'text-kaspi' : ''}`}>{m.label}</p>
            <p className="text-[11px] text-ink-soft">{m.hint}</p>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-ink-soft">
        Это демо: списания нет, абонемент активируется сразу после кнопки.
      </p>

      {phase === 'done' && lastPayment ? (
        <div className="mt-4 rounded-2xl bg-mint p-4 text-sm">
          <p className="font-extrabold text-teal-dark">Оплата прошла (демо)</p>
          <p className="mt-1 text-ink-soft">
            {tenge(lastPayment.amount)} · абонемент активен до {formatDate(lastPayment.periodEnd)}.
            Если прошлое время ещё не закончилось, дни добавились к нему.
          </p>
        </div>
      ) : (
        <button type="button" className="cta mt-4" disabled={phase === 'paying'} onClick={pay}>
          {phase === 'paying' ? 'Оплачиваем…' : `Оплатить ${tenge(plan.price)}`}
        </button>
      )}

      <div className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">История оплат</p>
            <p className="text-sm font-extrabold">Всего оплачено: {tenge(spent)}</p>
          </div>
          <CreditCard size={18} className="text-ink-soft" />
        </div>
        {payments.length === 0 && (
          <div className="card mt-2 p-4 text-sm text-ink-soft">Пока нет платежей.</div>
        )}
        <div className="mt-2 space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="card flex items-start justify-between gap-3 p-3">
              <div>
                <p className="font-bold">
                  {p.planId === 'trial'
                    ? 'Пробный период'
                    : p.planId === 'day'
                      ? 'Абонемент «День»'
                      : p.planId === 'week'
                        ? 'Абонемент «Неделя»'
                        : 'Абонемент «Месяц»'}
                </p>
                <p className="text-xs text-ink-soft">
                  {formatDateTime(p.createdAt)} ·{' '}
                  {p.method === 'kaspi' ? 'Kaspi' : p.method === 'card' ? 'Карта' : 'Подарок'}
                </p>
                <p className="text-xs text-ink-soft">
                  Доступ до {formatDate(p.periodEnd)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-extrabold">{p.amount === 0 ? '0 ₸' : tenge(p.amount)}</p>
                <p className="text-[11px] font-bold text-teal-dark">Оплачено</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-line p-3 text-xs text-ink-soft">
        <p className="font-bold text-ink">Для проверки демо</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-paper px-3 py-1.5 font-bold"
            onClick={() => {
              actions.previewExpiryInDays(2)
              setPhase('idle')
            }}
          >
            Осталось 2 дня
          </button>
          <button
            type="button"
            className="rounded-full bg-paper px-3 py-1.5 font-bold"
            onClick={() => {
              actions.expireSubscriptionNow()
              setPhase('idle')
            }}
          >
            Закончить сейчас
          </button>
        </div>
      </div>
    </div>
  )
}

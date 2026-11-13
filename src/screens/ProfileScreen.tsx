import { useState } from 'react'
import { formatDate } from '../lib/format'
import { isSubscriptionActive, kindLabel, remainingLabel } from '../lib/subscription'
import { actions, useStore } from '../store'

export function ProfileScreen() {
  const { name, phone, role, subscription } = useStore()
  const subActive = isSubscriptionActive(subscription)
  const [n, setN] = useState(name)
  const [p, setP] = useState(phone)

  return (
    <div className="flex min-h-full flex-col bg-cream px-4 pb-10">
      <header className="safe-top py-4">
        <h1 className="font-display text-2xl font-extrabold">Профиль</h1>
        <p className="text-sm text-ink-soft">Демо-вход, без серверной регистрации</p>
      </header>

      <label className="text-xs font-bold uppercase text-ink-soft">Имя</label>
      <input
        value={n}
        onChange={(e) => setN(e.target.value)}
        onBlur={() => actions.welcome(n, p, role)}
        className="mt-1 rounded-2xl border border-line bg-paper px-3 py-3 outline-none focus:border-teal"
      />
      <label className="mt-3 text-xs font-bold uppercase text-ink-soft">Телефон</label>
      <input
        value={p}
        onChange={(e) => setP(e.target.value)}
        onBlur={() => actions.welcome(n, p, role)}
        inputMode="tel"
        className="mt-1 rounded-2xl border border-line bg-paper px-3 py-3 outline-none focus:border-teal"
      />

      <p className="mt-6 text-xs font-bold uppercase text-ink-soft">Режим</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => actions.setRole('client')}
          className={`rounded-2xl border px-3 py-3 font-extrabold ${role === 'client' ? 'border-teal bg-mint' : 'border-line bg-paper'}`}
        >
          Клиент
        </button>
        <button
          type="button"
          onClick={() => actions.setRole('driver')}
          className={`rounded-2xl border px-3 py-3 font-extrabold ${role === 'driver' ? 'border-teal bg-mint' : 'border-line bg-paper'}`}
        >
          Водитель
        </button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-soft">
        Чтобы принять свой же заказ, переключитесь в режим водителя. Предложения водителей в
        клиентском режиме приходят автоматически — так удобно показать сервис по ссылке.
      </p>

      <button
        type="button"
        onClick={() => actions.go({ name: 'tariffs' })}
        className="card mt-5 w-full p-4 text-left"
      >
        <p className="text-xs font-bold uppercase text-ink-soft">Абонемент водителя</p>
        {subActive ? (
          <>
            <p className="mt-1 font-extrabold text-teal-dark">
              {kindLabel(subscription.kind)} · {remainingLabel(subscription.expiresAt)}
            </p>
            {subscription.expiresAt && (
              <p className="text-sm text-ink-soft">До {formatDate(subscription.expiresAt)}</p>
            )}
          </>
        ) : (
          <p className="mt-1 font-extrabold">
            {subscription.trialUsed ? 'Подписка не активна' : '7 дней бесплатно при входе как водитель'}
          </p>
        )}
        <p className="mt-2 text-sm font-bold text-teal-dark">Тарифы и история оплат →</p>
      </button>

      <div className="card mt-6 p-4 text-sm leading-relaxed">
        <p className="font-extrabold">Vezu · демо</p>
        <p className="mt-1 text-ink-soft">
          Алматы, цены в тенге. Карта OpenStreetMap, маршруты OSRM, поиск адресов Nominatim.
          Оплата (наличные, карта, Kaspi) пока только выбирается.
        </p>
      </div>

      <button
        type="button"
        className="mt-6 rounded-2xl py-3 text-sm font-bold text-coral"
        onClick={() => {
          if (confirm('Сбросить все заказы в этом браузере?')) actions.resetDemo()
        }}
      >
        Сбросить демо-данные
      </button>
    </div>
  )
}

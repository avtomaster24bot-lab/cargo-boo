import { useState } from 'react'
import { LegalLinks } from '../components/LegalLinks'
import { VEHICLES } from '../data/vehicles'
import { formatDate } from '../lib/format'
import { OPERATOR_EMAIL, PRIVACY_POLICY_VERSION, TERMS_VERSION } from '../lib/privacy'
import { isSubscriptionActive, kindLabel, remainingLabel } from '../lib/subscription'
import { actions, useStore } from '../store'
import type { VehicleId } from '../types'

export function ProfileScreen() {
  const { name, phone, role, subscription, consent, driverVehicleId, driverPlate } = useStore()
  const subActive = isSubscriptionActive(subscription)
  const [n, setN] = useState(name)
  const [p, setP] = useState(phone)
  const [vehicleId, setVehicleId] = useState<VehicleId>(driverVehicleId)
  const [plate, setPlate] = useState(driverPlate)

  function saveProfile() {
    actions.updateProfile({ name: n, phone: p, vehicleId, plate })
  }

  function exportData() {
    actions.exportMyData()
  }

  function onWithdraw() {
    const ok = confirm(
      'Отозвать согласие на обработку персональных данных? Вы не сможете пользоваться сервисом, пока не дадите согласие снова. Данные останутся в этом браузере, пока вы не удалите аккаунт.',
    )
    if (ok) actions.withdrawConsent()
  }

  function onDelete() {
    const ok = confirm(
      'Удалить аккаунт и все данные в этом браузере? Заказы, профиль, согласия и история оплат будут стерты без возможности восстановления.',
    )
    if (!ok) return
    const again = confirm('Подтвердите удаление: это действие нельзя отменить.')
    if (again) actions.deleteAccount()
  }

  return (
    <div className="flex min-h-full flex-col bg-cream px-4 pb-10">
      <header className="safe-top py-4">
        <h1 className="font-display text-2xl font-extrabold">Профиль</h1>
        <p className="text-sm text-ink-soft">Демо-вход, без серверной регистрации</p>
      </header>

      <label className="text-xs font-bold uppercase text-ink-soft">Имя (необязательно)</label>
      <input
        value={n}
        onChange={(e) => setN(e.target.value)}
        onBlur={saveProfile}
        autoComplete="name"
        className="mt-1 rounded-2xl border border-line bg-paper px-3 py-3 outline-none focus:border-teal"
      />
      <label className="mt-3 text-xs font-bold uppercase text-ink-soft">Телефон (необязательно)</label>
      <input
        value={p}
        onChange={(e) => setP(e.target.value)}
        onBlur={saveProfile}
        inputMode="tel"
        autoComplete="tel"
        className="mt-1 rounded-2xl border border-line bg-paper px-3 py-3 outline-none focus:border-teal"
      />

      {role === 'driver' && (
        <>
          <label className="mt-3 text-xs font-bold uppercase text-ink-soft">
            Тип кузова (необязательно)
          </label>
          <select
            value={vehicleId}
            onChange={(e) => {
              const next = e.target.value as VehicleId
              setVehicleId(next)
              actions.updateProfile({ name: n, phone: p, vehicleId: next, plate })
            }}
            className="mt-1 rounded-2xl border border-line bg-paper px-3 py-3 outline-none focus:border-teal"
          >
            {VEHICLES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.emoji} {v.name}
              </option>
            ))}
          </select>
          <label className="mt-3 text-xs font-bold uppercase text-ink-soft">
            Госномер (необязательно)
          </label>
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            onBlur={saveProfile}
            placeholder="например, 777 AAA 02"
            className="mt-1 rounded-2xl border border-line bg-paper px-3 py-3 outline-none focus:border-teal"
          />
        </>
      )}

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

      <section className="card mt-5 p-4">
        <p className="text-xs font-bold uppercase text-ink-soft">Персональные данные</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Согласие на обработку: {consent?.privacyAcceptedAt ? formatDate(consent.privacyAcceptedAt) : 'не дано'}
          {consent ? ` · политика ${consent.privacyVersion} · оферта ${consent.termsVersion}` : ''}.
          Актуальные версии: {PRIVACY_POLICY_VERSION} / {TERMS_VERSION}.
        </p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          Вопросы по данным: {OPERATOR_EMAIL}.
        </p>
        <button type="button" className="cta mt-3" onClick={exportData}>
          Скачать мои данные
        </button>
        <button
          type="button"
          className="mt-2 w-full rounded-2xl py-3 text-sm font-bold text-ink-soft"
          onClick={onWithdraw}
        >
          Отозвать согласие
        </button>
        <button
          type="button"
          className="w-full rounded-2xl py-3 text-sm font-bold text-coral"
          onClick={onDelete}
        >
          Удалить аккаунт и данные
        </button>
      </section>

      <div className="card mt-6 p-4 text-sm leading-relaxed">
        <p className="font-extrabold">Vezu · демо</p>
        <p className="mt-1 text-ink-soft">
          Алматы, цены в тенге. Карта OpenStreetMap, маршруты OSRM, поиск адресов Nominatim.
          Оплата заказа (наличные, Kaspi или карта через банк) пока только выбирается. Номер карты в
          приложение не вводится.
        </p>
        <LegalLinks className="mt-3" />
      </div>

      <button
        type="button"
        className="mt-6 rounded-2xl py-3 text-sm font-bold text-ink-soft"
        onClick={() => {
          if (confirm('Сбросить все заказы в этом браузере? Профиль и согласие сохранятся.')) {
            actions.resetDemo()
          }
        }}
      >
        Сбросить демо-данные
      </button>
    </div>
  )
}

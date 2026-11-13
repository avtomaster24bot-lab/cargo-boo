import { useState } from 'react'
import { InstallButton } from '../components/InstallApp'
import { LegalLinks } from '../components/LegalLinks'
import { VEHICLES } from '../data/vehicles'
import { hasValidConsent, legalUrl } from '../lib/privacy'
import { actions, useStore } from '../store'
import type { Role, VehicleId } from '../types'

export function WelcomeScreen() {
  const stored = useStore()
  const withdrawn = Boolean(stored.consent?.withdrawnAt)
  const [name, setName] = useState(stored.name)
  const [phone, setPhone] = useState(stored.phone)
  const [vehicleId, setVehicleId] = useState<VehicleId>(stored.driverVehicleId || 'gazelle')
  const [plate, setPlate] = useState(stored.driverPlate)
  const [consentPrivacy, setConsentPrivacy] = useState(false)
  const [consentTerms, setConsentTerms] = useState(false)
  const [hint, setHint] = useState('')

  const canEnter = consentPrivacy && consentTerms

  function enter(role: Role) {
    if (!canEnter) {
      setHint('Чтобы войти, отметьте согласие на обработку данных и принятие соглашения.')
      return
    }
    const ok = actions.welcome({
      name,
      phone,
      role,
      consentPrivacy,
      consentTerms,
      vehicleId,
      plate,
    })
    if (!ok) setHint('Чтобы войти, отметьте оба согласия.')
  }

  return (
    <div className="flex min-h-full flex-col bg-navy text-white">
      <div className="safe-top pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(255,106,26,0.45),_transparent_60%)]" />
      <div className="relative flex flex-1 flex-col px-6 pb-8 pt-16">
        <div className="mb-8">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-teal text-3xl shadow-lg shadow-teal/30">
            🚚
          </div>
          <p className="text-sm font-semibold tracking-wide text-teal">Алматы · Казахстан</p>
          <h1 className="font-display mt-2 text-4xl font-extrabold leading-tight">Vezu</h1>
          <p className="mt-3 max-w-[20rem] text-[15px] leading-relaxed text-white/75">
            Грузоперевозки почти в один тап. Как inDrive, Яндекс Доставка и FaFa — всё в одном
            сервисе.
          </p>
        </div>

        {withdrawn && !hasValidConsent(stored.consent) && (
          <div className="mb-5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-relaxed text-white/85">
            Вы отозвали согласие на обработку персональных данных. Сервисом можно пользоваться только
            после нового согласия. Данные ещё хранятся в этом браузере — их можно удалить в профиле
            после входа или оставить и дать согласие снова.
          </div>
        )}

        <label className="text-xs font-bold uppercase tracking-wide text-white/50">
          Как к вам обращаться
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя (необязательно)"
          autoComplete="name"
          className="mt-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-white/35 focus:border-teal"
        />
        <label className="mt-3 text-xs font-bold uppercase tracking-wide text-white/50">Телефон</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон (необязательно)"
          inputMode="tel"
          autoComplete="tel"
          className="mt-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-white/35 focus:border-teal"
        />

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-white/50">
          Если входите как водитель — данные автомобиля
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="col-span-1 text-[11px] text-white/45">
            Тип кузова (необязательно)
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value as VehicleId)}
              className="mt-1 w-full rounded-2xl border border-white/10 bg-navy-deep px-3 py-3 text-white outline-none focus:border-teal"
            >
              {VEHICLES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.emoji} {v.name}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-1 text-[11px] text-white/45">
            Госномер (необязательно)
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="например, 777 AAA 02"
              className="mt-1 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-white outline-none placeholder:text-white/35 focus:border-teal"
            />
          </label>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-white/40">
          Удостоверение личности, ИИН и сканы документов не запрашиваются.
        </p>

        <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm leading-relaxed">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-teal"
              checked={consentPrivacy}
              onChange={(e) => {
                setConsentPrivacy(e.target.checked)
                setHint('')
              }}
            />
            <span>
              Я даю согласие на сбор и обработку персональных данных в соответствии с{' '}
              <a className="font-bold text-teal underline" href={legalUrl('privacy')} target="_blank" rel="noreferrer">
                Политикой конфиденциальности
              </a>
              .
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-teal"
              checked={consentTerms}
              onChange={(e) => {
                setConsentTerms(e.target.checked)
                setHint('')
              }}
            />
            <span>
              Я принимаю{' '}
              <a className="font-bold text-teal underline" href={legalUrl('terms')} target="_blank" rel="noreferrer">
                пользовательское соглашение (публичную оферту)
              </a>
              .
            </span>
          </label>
        </div>
        {hint && <p className="mt-3 text-sm font-semibold text-amber">{hint}</p>}

        <div className="mt-auto space-y-3 pt-8">
          <button
            type="button"
            className="cta disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEnter}
            onClick={() => enter('client')}
          >
            Войти как клиент
          </button>
          <button
            type="button"
            className="cta cta-navy border border-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEnter}
            onClick={() => enter('driver')}
          >
            Войти как водитель · 7 дней бесплатно
          </button>
          <InstallButton light />
          <p className="px-2 text-center text-xs leading-relaxed text-white/45">
            Демо-режим: данные хранятся только в этом браузере. Ссылкой можно поделиться — каждый
            откроет свой сеанс. Без отмеченных согласий вход недоступен.
          </p>
          <LegalLinks light className="justify-center" />
        </div>
      </div>
    </div>
  )
}

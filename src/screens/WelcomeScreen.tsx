import { useState } from 'react'
import { actions } from '../store'
import type { Role } from '../types'

export function WelcomeScreen() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  function enter(role: Role) {
    actions.welcome(name, phone, role)
  }

  return (
    <div className="flex min-h-full flex-col bg-navy text-white">
      <div className="safe-top pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(14,159,138,0.45),_transparent_60%)]" />
      <div className="relative flex flex-1 flex-col px-6 pb-8 pt-16">
        <div className="mb-8">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-teal text-3xl shadow-lg shadow-teal/30">
            🚚
          </div>
          <p className="text-sm font-semibold tracking-wide text-teal">Алматы · Казахстан</p>
          <h1 className="font-display mt-2 text-4xl font-extrabold leading-tight">Карго Боо</h1>
          <p className="mt-3 max-w-[20rem] text-[15px] leading-relaxed text-white/75">
            Грузоперевозки почти в один тап. Как inDrive, Яндекс Доставка и FaFa — всё в одном
            сервисе.
          </p>
        </div>

        <label className="text-xs font-bold uppercase tracking-wide text-white/50">
          Как к вам обращаться
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя (необязательно)"
          className="mt-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-white/35 focus:border-teal"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон (необязательно)"
          inputMode="tel"
          className="mt-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3.5 text-white outline-none placeholder:text-white/35 focus:border-teal"
        />

        <div className="mt-auto space-y-3 pt-8">
          <button type="button" className="cta" onClick={() => enter('client')}>
            Войти как клиент
          </button>
          <button type="button" className="cta cta-navy border border-white/10" onClick={() => enter('driver')}>
            Войти как водитель
          </button>
          <p className="px-2 text-center text-xs leading-relaxed text-white/45">
            Демо-режим: данные хранятся только в этом браузере. Ссылкой можно поделиться — каждый
            откроет свой сеанс.
          </p>
        </div>
      </div>
    </div>
  )
}

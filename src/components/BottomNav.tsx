import { Clock3, Truck, UserRound } from 'lucide-react'
import { actions, useStore } from '../store'
import type { ScreenName } from '../types'

const CLIENT = [
  { name: 'home' as const, label: 'Заказать', icon: Truck },
  { name: 'history' as const, label: 'Заказы', icon: Clock3 },
  { name: 'profile' as const, label: 'Профиль', icon: UserRound },
]

const DRIVER = [
  { name: 'driver' as const, label: 'Заказы', icon: Truck },
  { name: 'history' as const, label: 'Мои', icon: Clock3 },
  { name: 'profile' as const, label: 'Профиль', icon: UserRound },
]

export const NAV_HIDDEN_SCREENS: ScreenName[] = [
  'address',
  'confirm',
  'search',
  'tracking',
  'chat',
  'rating',
  'driver-order',
  'tariffs',
]

export function BottomNav() {
  const { role, screen } = useStore()
  if (NAV_HIDDEN_SCREENS.includes(screen.name)) return null
  const items = role === 'driver' ? DRIVER : CLIENT
  return (
    <nav className="safe-bottom sticky bottom-0 z-30 border-t border-line bg-paper/95 backdrop-blur">
      <div className="grid grid-cols-3 px-2 pt-1">
        {items.map((item) => {
          const active = screen.name === item.name
          const Icon = item.icon
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => actions.go({ name: item.name }, true)}
              className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-bold ${
                active ? 'text-teal-dark' : 'text-ink-soft'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

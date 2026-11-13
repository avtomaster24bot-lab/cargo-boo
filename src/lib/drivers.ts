import { DRIVERS } from '../data/drivers'
import { actions, getStore } from '../store'
import type { Driver } from '../types'

export function resolveDriver(id: string | undefined): Driver | undefined {
  if (!id) return undefined
  if (id === actions.demoSelfDriverId()) return actions.selfDriver()
  return DRIVERS.find((d) => d.id === id)
}

export function displayName(): string {
  return getStore().name.trim() || 'Гость'
}

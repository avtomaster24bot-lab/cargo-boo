import { EXPIRY_REMINDER_DAYS } from '../data/plans'
import type { DriverSubscription } from '../types'

const DAY_MS = 24 * 60 * 60 * 1000

export function msLeft(expiresAt: string | null, now = Date.now()): number {
  if (!expiresAt) return 0
  return new Date(expiresAt).getTime() - now
}

export function isSubscriptionActive(sub: DriverSubscription, now = Date.now()): boolean {
  return msLeft(sub.expiresAt, now) > 0
}

export function daysLeft(expiresAt: string | null, now = Date.now()): number {
  const ms = msLeft(expiresAt, now)
  if (ms <= 0) return 0
  return Math.ceil(ms / DAY_MS)
}

export function pluralDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'день'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня'
  return 'дней'
}

export function remainingLabel(expiresAt: string | null, now = Date.now()): string {
  const ms = msLeft(expiresAt, now)
  if (ms <= 0) return 'истёк'
  const hours = Math.ceil(ms / (60 * 60 * 1000))
  if (hours < 24) {
    if (hours <= 1) return 'остался менее часа'
    return `осталось ${hours} ч`
  }
  const days = Math.ceil(ms / DAY_MS)
  return `осталось ${days} ${pluralDays(days)}`
}

export function shouldRemind(sub: DriverSubscription, now = Date.now()): boolean {
  const ms = msLeft(sub.expiresAt, now)
  return ms > 0 && ms <= EXPIRY_REMINDER_DAYS * DAY_MS
}

export function extendExpiry(currentExpiresAt: string | null, days: number, now = new Date()): Date {
  const current = currentExpiresAt ? new Date(currentExpiresAt) : now
  const base = current.getTime() > now.getTime() ? current : now
  return new Date(base.getTime() + days * DAY_MS)
}

export function defaultSubscription(): DriverSubscription {
  return {
    kind: null,
    startedAt: null,
    expiresAt: null,
    trialUsed: false,
  }
}

export function kindLabel(kind: DriverSubscription['kind']): string {
  if (kind === 'trial') return 'Пробный период'
  if (kind === 'day') return 'Абонемент «День»'
  if (kind === 'week') return 'Абонемент «Неделя»'
  if (kind === 'month') return 'Абонемент «Месяц»'
  return 'Нет абонемента'
}

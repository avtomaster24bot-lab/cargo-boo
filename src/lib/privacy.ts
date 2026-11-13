import type { ConsentRecord, Order, OrderStatus } from '../types'

/** Версия политики конфиденциальности, которую пользователь принимает при регистрации. */
export const PRIVACY_POLICY_VERSION = '2026-11-13'

/** Версия пользовательского соглашения / публичной оферты. */
export const TERMS_VERSION = '2026-11-13'

/**
 * Срок хранения персональных полей завершённых заказов в демо (дни).
 * После истечения адреса, контакты, переписка и фото обезличиваются.
 * Константу можно изменить — логика читает только её.
 */
export const ORDER_RETENTION_DAYS = 180

/** Заполнитель: укажите рабочий email оператора после проверки юристом. */
export const OPERATOR_EMAIL = '[email оператора]'

export const LEGAL_DRAFT_NOTICE =
  'Это черновик для демо-сервиса Vezu. Текст не является юридической консультацией и подлежит проверке юристом до запуска реального сервиса.'

const TERMINAL: OrderStatus[] = ['delivered', 'cancelled', 'rated']

const PHONE_VISIBLE: OrderStatus[] = [
  'accepted',
  'enroute_pickup',
  'loading',
  'enroute_drop',
]

export function isOrderPhoneVisible(status: OrderStatus): boolean {
  return PHONE_VISIBLE.includes(status)
}

/** Маска вида +7 7** *** **12. Пустую строку не трогает. */
export function maskPhone(phone: string): string {
  const raw = phone.trim()
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 2) return '•••'
  const last2 = digits.slice(-2)
  if (digits.length >= 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    const national = digits.slice(-10)
    const prefix = national[0] ?? '7'
    return `+7 ${prefix}** *** **${last2}`
  }
  if (digits.length >= 10) {
    const prefix = digits[0]
    return `${prefix}** *** **${last2}`
  }
  return `••• **${last2}`
}

export function visiblePhone(phone: string, status: OrderStatus): string {
  if (!phone) return ''
  return isOrderPhoneVisible(status) ? phone : maskPhone(phone)
}

function appBaseUrl(): string {
  const raw =
    typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL
      ? String(import.meta.env.BASE_URL)
      : '/'
  return raw.endsWith('/') ? raw : `${raw}/`
}

export function legalUrl(page: 'privacy' | 'terms'): string {
  return `${appBaseUrl()}${page}`
}

export function legalPageFromPath(pathname = window.location.pathname): 'privacy' | 'terms' | null {
  const path = pathname.replace(/\/+$/, '')
  if (/(?:^|\/)privacy$/.test(path)) return 'privacy'
  if (/(?:^|\/)terms$/.test(path)) return 'terms'
  return null
}

export function completedAt(order: Order): string | null {
  if (!TERMINAL.includes(order.status)) return null
  const events = [...order.statusHistory].reverse()
  const hit = events.find((e) => TERMINAL.includes(e.status))
  return hit?.at ?? order.createdAt
}

export function shouldAnonymiseOrder(
  order: Order,
  now = new Date(),
  retentionDays = ORDER_RETENTION_DAYS,
): boolean {
  if (order.anonymisedAt) return false
  const at = completedAt(order)
  if (!at) return false
  const ageMs = now.getTime() - new Date(at).getTime()
  return ageMs >= retentionDays * 24 * 60 * 60 * 1000
}

function coarsen(value: number): number {
  return Math.round(value * 100) / 100
}

export function anonymiseOrder(order: Order, at = new Date().toISOString()): Order {
  if (order.anonymisedAt) return order
  return {
    ...order,
    pickup: {
      lat: coarsen(order.pickup.lat),
      lng: coarsen(order.pickup.lng),
      address: 'Адрес удалён',
    },
    dropoff: {
      lat: coarsen(order.dropoff.lat),
      lng: coarsen(order.dropoff.lng),
      address: 'Адрес удалён',
    },
    clientName: '',
    clientPhone: '',
    cargoDescription: '',
    cargoPhoto: undefined,
    messages: [
      {
        id: `anon-${order.id}`,
        author: 'system',
        text: 'Переписка и персональные данные заказа удалены по сроку хранения.',
        createdAt: at,
      },
    ],
    anonymisedAt: at,
  }
}

export function anonymiseStaleOrders(
  orders: Order[],
  now = new Date(),
  retentionDays = ORDER_RETENTION_DAYS,
): { orders: Order[]; changed: number } {
  let changed = 0
  const next = orders.map((order) => {
    if (!shouldAnonymiseOrder(order, now, retentionDays)) return order
    changed += 1
    return anonymiseOrder(order, now.toISOString())
  })
  return { orders: next, changed }
}


export function hasValidConsent(consent: ConsentRecord | null | undefined): boolean {
  return Boolean(
    consent &&
      !consent.withdrawnAt &&
      consent.privacyAcceptedAt &&
      consent.termsAcceptedAt &&
      consent.privacyVersion === PRIVACY_POLICY_VERSION &&
      consent.termsVersion === TERMS_VERSION,
  )
}

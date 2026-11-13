import assert from 'node:assert/strict'
import { anonymiseOrder, hasValidConsent, maskPhone, shouldAnonymiseOrder } from './privacy.ts'
import type { Order } from '../types.ts'

function sample(over: Partial<Order> = {}): Order {
  return {
    id: 'ord-1',
    shortId: 'AB12',
    createdAt: '2024-01-01T00:00:00.000Z',
    pickup: { lat: 43.238, lng: 76.945, address: 'ул. Абая, 1' },
    dropoff: { lat: 43.25, lng: 76.95, address: 'пр. Достык, 10' },
    distanceKm: 5,
    durationMin: 15,
    route: [],
    vehicleId: 'gazelle',
    options: {
      loaders: 0,
      packaging: false,
      insurance: false,
      urgent: false,
      timeMode: 'now',
      scheduledAt: null,
    },
    cargoDescription: 'шкаф',
    cargoPhoto: 'data:image/png;base64,xxx',
    estimatedPrice: 5000,
    clientPrice: 5000,
    payment: 'kaspi',
    status: 'rated',
    offers: [],
    messages: [{ id: 'm1', author: 'client', text: 'Мой телефон +7 707 111 22 33', createdAt: '2024-01-01T00:00:00.000Z' }],
    statusHistory: [
      { status: 'searching', at: '2024-01-01T00:00:00.000Z' },
      { status: 'rated', at: '2024-01-01T02:00:00.000Z' },
    ],
    clientName: 'Асан',
    clientPhone: '+7 707 111 22 33',
    ...over,
  }
}

assert.equal(maskPhone('+7 707 111 22 01'), '+7 7** *** **01')
assert.equal(maskPhone('+77071112212'), '+7 7** *** **12')
assert.equal(maskPhone('87771112233'), '+7 7** *** **33')
assert.equal(maskPhone(''), '')
assert.equal(maskPhone('12'), '••• **12')

const fresh = sample({
  status: 'rated',
  statusHistory: [{ status: 'rated', at: '2026-11-01T00:00:00.000Z' }],
})
assert.equal(shouldAnonymiseOrder(fresh, new Date('2026-11-13T00:00:00.000Z'), 180), false)

const old = sample()
assert.equal(shouldAnonymiseOrder(old, new Date('2026-11-13T00:00:00.000Z'), 180), true)
assert.equal(shouldAnonymiseOrder(sample({ status: 'accepted' }), new Date('2026-11-13T00:00:00.000Z'), 180), false)

const anon = anonymiseOrder(old, '2026-11-13T00:00:00.000Z')
assert.equal(anon.pickup.address, 'Адрес удалён')
assert.equal(anon.dropoff.address, 'Адрес удалён')
assert.equal(anon.clientName, '')
assert.equal(anon.clientPhone, '')
assert.equal(anon.cargoDescription, '')
assert.equal(anon.cargoPhoto, undefined)
assert.equal(anon.anonymisedAt, '2026-11-13T00:00:00.000Z')
assert.equal(anon.messages[0]?.text.includes('удалены'), true)
assert.equal(shouldAnonymiseOrder(anon, new Date('2026-11-13T00:00:00.000Z'), 180), false)

assert.equal(hasValidConsent(null), false)
assert.equal(
  hasValidConsent({
    privacyVersion: '2026-11-13',
    termsVersion: '2026-11-13',
    privacyAcceptedAt: '2026-11-13T00:00:00.000Z',
    termsAcceptedAt: '2026-11-13T00:00:00.000Z',
    withdrawnAt: null,
  }),
  true,
)
assert.equal(
  hasValidConsent({
    privacyVersion: '2026-11-13',
    termsVersion: '2026-11-13',
    privacyAcceptedAt: '2026-11-13T00:00:00.000Z',
    termsAcceptedAt: '2026-11-13T00:00:00.000Z',
    withdrawnAt: '2026-11-13T12:00:00.000Z',
  }),
  false,
)

console.log('privacy tests passed')

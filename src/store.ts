import { useSyncExternalStore } from 'react'
import { DRIVERS, driversForVehicle } from './data/drivers'
import { planById, TRIAL_DAYS, type PlanId } from './data/plans'
import { estimatePrice } from './lib/pricing'
import { routeOsrm } from './lib/geo'
import { shortId, uid } from './lib/id'
import { NEXT_STATUS } from './lib/status'
import { anonymiseStaleOrders, hasValidConsent, PRIVACY_POLICY_VERSION, TERMS_VERSION } from './lib/privacy'
import { defaultSubscription, extendExpiry, isSubscriptionActive } from './lib/subscription'
import type {
  AuditEvent,
  ConsentRecord,
  Draft,
  DriverSubscription,
  Offer,
  Order,
  OrderOptions,
  OrderStatus,
  PaymentMethod,
  Role,
  Screen,
  SubPayment,
  SubPaymentMethod,
  VehicleId,
} from './types'

const STORAGE_KEY = 'cargo-boo-v1'

export const defaultOptions = (): OrderOptions => ({
  loaders: 0,
  packaging: false,
  insurance: false,
  urgent: false,
  timeMode: 'now',
  scheduledAt: null,
})

export const defaultDraft = (): Draft => ({
  pickup: null,
  dropoff: null,
  distanceKm: 0,
  durationMin: 0,
  route: [],
  vehicleId: 'gazelle',
  options: defaultOptions(),
  cargoDescription: '',
  estimatedPrice: 0,
  clientPrice: 0,
  payment: 'kaspi',
  routing: 'idle',
})

export interface StoreState {
  ready: boolean
  seenWelcome: boolean
  role: Role
  name: string
  phone: string
  driverVehicleId: VehicleId
  driverPlate: string
  consent: ConsentRecord | null
  auditLog: AuditEvent[]
  screen: Screen
  stack: Screen[]
  draft: Draft
  orders: Order[]
  currentOrderId: string | null
  subscription: DriverSubscription
  payments: SubPayment[]
}

interface PersistShape {
  seenWelcome: boolean
  role: Role
  name: string
  phone: string
  driverVehicleId?: VehicleId
  driverPlate?: string
  consent?: ConsentRecord | null
  auditLog?: AuditEvent[]
  orders: Order[]
  currentOrderId: string | null
  subscription?: DriverSubscription
  payments?: SubPayment[]
}

const initial: StoreState = {
  ready: false,
  seenWelcome: false,
  role: 'client',
  name: '',
  phone: '',
  driverVehicleId: 'gazelle',
  driverPlate: '',
  consent: null,
  auditLog: [],
  screen: { name: 'home' },
  stack: [],
  draft: defaultDraft(),
  orders: [],
  currentOrderId: null,
  subscription: defaultSubscription(),
  payments: [],
}

let state: StoreState = initial
const listeners = new Set<() => void>()
const offerTimers = new Map<string, number[]>()

function emit() {
  listeners.forEach((fn) => fn())
}

function persist() {
  const payload: PersistShape = {
    seenWelcome: state.seenWelcome,
    role: state.role,
    name: state.name,
    phone: state.phone,
    driverVehicleId: state.driverVehicleId,
    driverPlate: state.driverPlate,
    consent: state.consent,
    auditLog: state.auditLog,
    orders: state.orders,
    currentOrderId: state.currentOrderId,
    subscription: state.subscription,
    payments: state.payments,
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // quota — drop photos on oldest delivered orders and retry once
    try {
      const slim = {
        ...payload,
        orders: payload.orders.map((o, i) =>
          i < payload.orders.length - 8 || o.cargoPhoto && o.status === 'rated'
            ? { ...o, cargoPhoto: undefined }
            : o,
        ),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
    } catch {
      /* ignore */
    }
  }
}


function migratePaymentMethod(method: string): SubPayment['method'] {
  if (method === 'card') return 'halyk'
  if (method === 'kaspi' || method === 'halyk' || method === 'freedom' || method === 'trial') {
    return method
  }
  return 'kaspi'
}

function migrateOrder(order: Order): Order {
  return {
    ...order,
    clientName: order.clientName ?? '',
    clientPhone: order.clientPhone ?? '',
  }
}

function appendAudit(list: AuditEvent[], action: AuditEvent['action'], detail?: string): AuditEvent[] {
  const event: AuditEvent = {
    id: uid('aud'),
    action,
    at: new Date().toISOString(),
    detail,
  }
  return [event, ...list].slice(0, 200)
}

function setState(patch: Partial<StoreState> | ((s: StoreState) => StoreState)) {
  state = typeof patch === 'function' ? patch(state) : { ...state, ...patch }
  persist()
  emit()
}

function patchOrder(orderId: string, fn: (order: Order) => Order) {
  setState((s) => ({
    ...s,
    orders: s.orders.map((o) => (o.id === orderId ? fn(o) : o)),
  }))
}

function load() {
  let saved: PersistShape | null = null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) saved = JSON.parse(raw) as PersistShape
  } catch {
    saved = null
  }
  const loadedOrders = (saved?.orders ?? []).map(migrateOrder)
  const anonymised = anonymiseStaleOrders(loadedOrders)
  let auditLog = saved?.auditLog ?? []
  if (anonymised.changed > 0) {
    auditLog = appendAudit(auditLog, 'orders_anonymised', `заказов: ${anonymised.changed}`)
  }
  const consent = saved?.consent ?? null
  const seenWelcome = (saved?.seenWelcome ?? false) && hasValidConsent(consent)
  state = {
    ...initial,
    ready: true,
    seenWelcome,
    role: saved?.role ?? 'client',
    name: saved?.name ?? '',
    phone: saved?.phone ?? '',
    driverVehicleId: saved?.driverVehicleId ?? 'gazelle',
    driverPlate: saved?.driverPlate ?? '',
    consent,
    auditLog,
    orders: anonymised.orders,
    currentOrderId: saved?.currentOrderId ?? null,
    subscription: saved?.subscription ?? defaultSubscription(),
    payments: (saved?.payments ?? []).map((p) => ({
      ...p,
      method: migratePaymentMethod(p.method),
    })),
    screen:
      saved?.role === 'driver'
        ? { name: 'driver' }
        : saved?.currentOrderId
          ? resumeScreen(anonymised.orders, saved.currentOrderId)
          : { name: 'home' },
    stack: [],
    draft: defaultDraft(),
  }
  if (state.role === 'driver' && seenWelcome) {
    state = withTrial(state)
  }
  persist()
  emit()
  for (const order of state.orders) {
    if (order.status === 'searching') resumeOffers(order.id)
  }
}

function resumeScreen(orders: Order[], id: string): Screen {
  const order = orders.find((o) => o.id === id)
  if (!order) return { name: 'home' }
  if (order.status === 'searching') return { name: 'search', orderId: id }
  if (order.status === 'delivered') return { name: 'rating', orderId: id }
  if (order.status === 'rated' || order.status === 'cancelled') return { name: 'home' }
  return { name: 'tracking', orderId: id }
}

function recalcDraftPrices(draft: Draft): Draft {
  if (!draft.pickup || !draft.dropoff || draft.distanceKm <= 0) {
    return { ...draft, estimatedPrice: 0, clientPrice: draft.clientPrice }
  }
  const total = estimatePrice(draft.vehicleId, draft.distanceKm, draft.options).total
  const customized =
    draft.estimatedPrice > 0 && draft.clientPrice > 0 && draft.clientPrice !== draft.estimatedPrice
  return {
    ...draft,
    estimatedPrice: total,
    clientPrice: customized ? draft.clientPrice : total,
  }
}

async function refreshRoute() {
  const { pickup, dropoff } = state.draft
  if (!pickup || !dropoff) {
    setState({
      draft: recalcDraftPrices({
        ...state.draft,
        distanceKm: 0,
        durationMin: 0,
        route: [],
        routing: 'idle',
      }),
    })
    return
  }
  setState({ draft: { ...state.draft, routing: 'loading' } })
  const result = await routeOsrm(pickup, dropoff)
  if (state.draft.pickup !== pickup || state.draft.dropoff !== dropoff) return
  const next: Draft = recalcDraftPrices({
    ...state.draft,
    distanceKm: result.distanceKm,
    durationMin: result.durationMin,
    route: result.path,
    routing: 'ready',
  })
  setState({ draft: next })
}

function go(screen: Screen, replace = false) {
  setState((s) => ({
    ...s,
    screen,
    stack: replace ? s.stack : [...s.stack, s.screen],
  }))
}

function back() {
  setState((s) => {
    if (s.stack.length === 0) {
      return {
        ...s,
        screen: s.role === 'driver' ? { name: 'driver' } : { name: 'home' },
      }
    }
    const stack = s.stack.slice(0, -1)
    const screen = s.stack[s.stack.length - 1]
    return { ...s, stack, screen }
  })
}

function withTrial(s: StoreState): StoreState {
  if (s.subscription.trialUsed) return s
  if (isSubscriptionActive(s.subscription)) {
    return { ...s, subscription: { ...s.subscription, trialUsed: true } }
  }
  const now = new Date()
  const expires = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
  const startedAt = now.toISOString()
  const expiresAt = expires.toISOString()
  const payment: SubPayment = {
    id: uid('pay'),
    planId: 'trial',
    amount: 0,
    method: 'trial',
    createdAt: startedAt,
    periodStart: startedAt,
    periodEnd: expiresAt,
    status: 'paid',
  }
  return {
    ...s,
    subscription: {
      kind: 'trial',
      startedAt,
      expiresAt,
      trialUsed: true,
    },
    payments: [payment, ...s.payments],
  }
}

function setRole(role: Role) {
  setState((s) => {
    const next: StoreState = {
      ...s,
      role,
      screen: role === 'driver' ? { name: 'driver' } : { name: 'home' },
      stack: [],
    }
    return role === 'driver' ? withTrial(next) : next
  })
}

export interface WelcomeInput {
  name: string
  phone: string
  role: Role
  consentPrivacy: boolean
  consentTerms: boolean
  vehicleId?: VehicleId
  plate?: string
}

function welcome(input: WelcomeInput): boolean {
  if (!input.consentPrivacy || !input.consentTerms) return false
  const now = new Date().toISOString()
  const consent: ConsentRecord = {
    privacyVersion: PRIVACY_POLICY_VERSION,
    termsVersion: TERMS_VERSION,
    privacyAcceptedAt: now,
    termsAcceptedAt: now,
    withdrawnAt: null,
  }
  setState((s) => {
    const role = input.role
    const next: StoreState = {
      ...s,
      seenWelcome: true,
      name: input.name.trim() || (role === 'driver' ? 'Водитель' : 'Клиент'),
      phone: input.phone.trim(),
      driverVehicleId: input.vehicleId ?? s.driverVehicleId,
      driverPlate: (input.plate ?? s.driverPlate).trim(),
      consent,
      auditLog: appendAudit(s.auditLog, 'consent_accepted', `политика ${PRIVACY_POLICY_VERSION}`),
      role,
      screen: role === 'driver' ? { name: 'driver' } : { name: 'home' },
      stack: [],
    }
    return role === 'driver' ? withTrial(next) : next
  })
  return true
}

function updateProfile(partial: { name?: string; phone?: string; vehicleId?: VehicleId; plate?: string }) {
  setState((s) => ({
    ...s,
    name: partial.name !== undefined ? partial.name.trim() : s.name,
    phone: partial.phone !== undefined ? partial.phone.trim() : s.phone,
    driverVehicleId: partial.vehicleId ?? s.driverVehicleId,
    driverPlate: partial.plate !== undefined ? partial.plate.trim() : s.driverPlate,
  }))
}

function exportMyData() {
  const snapshot = {
    exportedAt: new Date().toISOString(),
    profile: {
      name: state.name,
      phone: state.phone,
      role: state.role,
      driverVehicleId: state.role === 'driver' ? state.driverVehicleId : undefined,
      driverPlate: state.role === 'driver' ? state.driverPlate : undefined,
    },
    consent: state.consent,
    orders: state.orders,
    subscription: state.subscription,
    payments: state.payments,
    auditLog: state.auditLog,
  }
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vezu-my-data-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  setState((s) => ({
    ...s,
    auditLog: appendAudit(s.auditLog, 'data_exported'),
  }))
}

function withdrawConsent() {
  if (!state.consent || state.consent.withdrawnAt) return
  const now = new Date().toISOString()
  setState((s) => ({
    ...s,
    seenWelcome: false,
    consent: s.consent ? { ...s.consent, withdrawnAt: now } : s.consent,
    auditLog: appendAudit(s.auditLog, 'consent_withdrawn'),
    screen: { name: 'home' },
    stack: [],
  }))
}

function deleteAccount() {
  for (const id of offerTimers.keys()) clearOffers(id)
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  state = {
    ...initial,
    ready: true,
  }
  emit()
}

function paySubscription(planId: PlanId, method: SubPaymentMethod): SubPayment | null {
  const plan = planById(planId)
  const now = new Date()
  const periodStart = (isSubscriptionActive(state.subscription) && state.subscription.expiresAt
    ? new Date(state.subscription.expiresAt)
    : now
  ).toISOString()
  const expires = extendExpiry(state.subscription.expiresAt, plan.days, now)
  const payment: SubPayment = {
    id: uid('pay'),
    planId: plan.id,
    amount: plan.price,
    method,
    createdAt: now.toISOString(),
    periodStart,
    periodEnd: expires.toISOString(),
    status: 'paid',
  }
  setState((s) => ({
    ...s,
    subscription: {
      kind: plan.id,
      startedAt: s.subscription.startedAt ?? now.toISOString(),
      expiresAt: expires.toISOString(),
      trialUsed: true,
    },
    payments: [payment, ...s.payments],
  }))
  return payment
}

function expireSubscriptionNow() {
  const now = new Date().toISOString()
  setState((s) => ({
    ...s,
    subscription: {
      ...s.subscription,
      expiresAt: s.subscription.expiresAt ? new Date(Date.now() - 1000).toISOString() : now,
    },
  }))
}

function previewExpiryInDays(days: number) {
  const now = new Date()
  const expires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  setState((s) => ({
    ...s,
    subscription: {
      kind: s.subscription.kind ?? 'trial',
      startedAt: s.subscription.startedAt ?? now.toISOString(),
      expiresAt: expires.toISOString(),
      trialUsed: true,
    },
  }))
}

function patchDraft(partial: Partial<Draft>) {
  const draft = recalcDraftPrices({ ...state.draft, ...partial })
  setState({ draft })
  if ('pickup' in partial || 'dropoff' in partial) {
    void refreshRoute()
  }
}

function patchOptions(partial: Partial<OrderOptions>) {
  const options = { ...state.draft.options, ...partial }
  if (partial.timeMode === 'now') options.scheduledAt = null
  setState({ draft: recalcDraftPrices({ ...state.draft, options }) })
}

function setVehicle(vehicleId: VehicleId) {
  setState({ draft: recalcDraftPrices({ ...state.draft, vehicleId }) })
}

function setPayment(payment: PaymentMethod) {
  setState({ draft: { ...state.draft, payment } })
}

function setClientPrice(clientPrice: number) {
  setState({ draft: { ...state.draft, clientPrice: Math.max(0, Math.round(clientPrice)) } })
}

function placeOrder(): string | null {
  const d = state.draft
  if (!d.pickup || !d.dropoff || d.estimatedPrice <= 0) return null
  const now = new Date().toISOString()
  const price = d.clientPrice > 0 ? d.clientPrice : d.estimatedPrice
  const order: Order = {
    id: uid('ord'),
    shortId: shortId(),
    createdAt: now,
    pickup: d.pickup,
    dropoff: d.dropoff,
    distanceKm: d.distanceKm,
    durationMin: d.durationMin,
    route: d.route,
    vehicleId: d.vehicleId,
    options: { ...d.options },
    cargoDescription: d.cargoDescription.trim(),
    cargoPhoto: d.cargoPhoto,
    estimatedPrice: d.estimatedPrice,
    clientPrice: price,
    payment: d.payment,
    status: 'searching',
    clientName: state.name.trim(),
    clientPhone: state.phone.trim(),
    offers: [],
    messages: [
      {
        id: uid('msg'),
        author: 'system',
        text: 'Заказ создан. Ищем водителей поблизости.',
        createdAt: now,
      },
    ],
    statusHistory: [{ status: 'searching', at: now }],
  }
  setState((s) => ({
    ...s,
    orders: [order, ...s.orders],
    currentOrderId: order.id,
    draft: defaultDraft(),
    screen: { name: 'search', orderId: order.id },
    stack: [{ name: 'home' }],
  }))
  startOffers(order.id)
  return order.id
}

function startOffers(orderId: string) {
  clearOffers(orderId)
  const order = state.orders.find((o) => o.id === orderId)
  if (!order) return
  const drivers = driversForVehicle(order.vehicleId).slice(0, 4)
  const timers: number[] = []
  drivers.forEach((driver, index) => {
    const wait = 1600 + index * 2100 + Math.round(Math.random() * 600)
    const t = window.setTimeout(() => addSimulatedOffer(orderId, driver.id), wait)
    timers.push(t)
  })
  offerTimers.set(orderId, timers)
}

function resumeOffers(orderId: string) {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'searching') return
  const have = new Set(order.offers.map((o) => o.driverId))
  const missing = driversForVehicle(order.vehicleId).filter((d) => !have.has(d.id)).slice(0, 3)
  if (missing.length === 0) return
  const timers: number[] = []
  missing.forEach((driver, index) => {
    const t = window.setTimeout(() => addSimulatedOffer(orderId, driver.id), 800 + index * 1600)
    timers.push(t)
  })
  offerTimers.set(orderId, timers)
}

function clearOffers(orderId: string) {
  const timers = offerTimers.get(orderId)
  if (timers) timers.forEach((t) => window.clearTimeout(t))
  offerTimers.delete(orderId)
}

function addSimulatedOffer(orderId: string, driverId: string) {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'searching') return
  if (order.offers.some((o) => o.driverId === driverId)) return
  const ratio = order.clientPrice / Math.max(1, order.estimatedPrice)
  let price = order.clientPrice
  let kind: Offer['kind'] = 'accept'
  const jitter = Math.round((Math.random() * 4 - 2) * 100)
  if (ratio < 0.7) {
    kind = 'counter'
    price = round100(order.estimatedPrice * (0.86 + Math.random() * 0.1))
  } else if (ratio < 0.92) {
    if (Math.random() < 0.55) {
      kind = 'counter'
      price = round100((order.clientPrice + order.estimatedPrice) / 2 + jitter)
    } else {
      price = order.clientPrice
    }
  } else if (Math.random() < 0.35) {
    kind = 'accept'
    price = round100(Math.max(order.clientPrice - 300, order.clientPrice * 0.97))
  }
  pushOffer(orderId, driverId, price, kind)
}

function round100(n: number): number {
  return Math.max(100, Math.round(n / 100) * 100)
}

function etaFor(driverId: string, order: Order): number {
  const driver = DRIVERS.find((d) => d.id === driverId)
  if (!driver) return 12
  const dx = driver.lat - order.pickup.lat
  const dy = driver.lng - order.pickup.lng
  const km = Math.sqrt(dx * dx + dy * dy) * 95
  return Math.max(6, Math.round(km * 2.4 + 4))
}

function pushOffer(orderId: string, driverId: string, price: number, kind: Offer['kind']) {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'searching') return
  const offer: Offer = {
    id: uid('off'),
    driverId,
    price: round100(price),
    etaMin: etaFor(driverId, order),
    createdAt: new Date().toISOString(),
    kind,
  }
  const driver = DRIVERS.find((d) => d.id === driverId)
  const text =
    kind === 'accept'
      ? `${driver?.name ?? 'Водитель'} готов взять заказ за ${offer.price.toLocaleString('ru-RU')} ₸`
      : `${driver?.name ?? 'Водитель'} предлагает ${offer.price.toLocaleString('ru-RU')} ₸`
  patchOrder(orderId, (o) => ({
    ...o,
    offers: [...o.offers, offer],
    messages: [
      ...o.messages,
      { id: uid('msg'), author: 'system', text, createdAt: offer.createdAt },
    ],
  }))
}

function acceptOffer(orderId: string, offerId: string) {
  const order = state.orders.find((o) => o.id === orderId)
  const offer = order?.offers.find((o) => o.id === offerId)
  if (!order || !offer) return
  clearOffers(orderId)
  const now = new Date().toISOString()
  const driver = DRIVERS.find((d) => d.id === offer.driverId)
  patchOrder(orderId, (o) => ({
    ...o,
    status: 'accepted',
    assignedDriverId: offer.driverId,
    agreedPrice: offer.price,
    statusHistory: [...o.statusHistory, { status: 'accepted', at: now }],
    messages: [
      ...o.messages,
      {
        id: uid('msg'),
        author: 'system',
        text: `Заказ принял ${driver?.name ?? 'водитель'}. Цена ${offer.price.toLocaleString('ru-RU')} ₸.`,
        createdAt: now,
      },
    ],
  }))
  setState({
    currentOrderId: orderId,
    screen: { name: 'tracking', orderId },
    stack: [{ name: 'home' }],
  })
}

function driverOffer(orderId: string, price: number, kind: Offer['kind'] = 'counter') {
  if (!isSubscriptionActive(state.subscription)) {
    go({ name: 'tariffs' })
    return
  }
  const self = demoSelfDriverId()
  pushOffer(orderId, self, price, kind)
}

function demoSelfDriverId(): string {
  return 'drv-self'
}

function takeOrder(orderId: string, price?: number) {
  if (!isSubscriptionActive(state.subscription)) {
    go({ name: 'tariffs' })
    return
  }
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'searching') return
  const now = new Date().toISOString()
  const agreed = round100(price ?? order.clientPrice)
  clearOffers(orderId)
  patchOrder(orderId, (o) => ({
    ...o,
    status: 'accepted',
    assignedDriverId: demoSelfDriverId(),
    agreedPrice: agreed,
    offers: [
      ...o.offers,
      {
        id: uid('off'),
        driverId: demoSelfDriverId(),
        price: agreed,
        etaMin: 10,
        createdAt: now,
        kind: 'accept',
      },
    ],
    statusHistory: [...o.statusHistory, { status: 'accepted', at: now }],
    messages: [
      ...o.messages,
      {
        id: uid('msg'),
        author: 'system',
        text: `Вы приняли заказ за ${agreed.toLocaleString('ru-RU')} ₸.`,
        createdAt: now,
      },
    ],
  }))
  setState({
    currentOrderId: orderId,
    screen: { name: 'driver-order', orderId },
    stack: [{ name: 'driver' }],
  })
}

function selfDriver() {
  const name = state.name.trim() || 'Вы'
  return {
    id: demoSelfDriverId(),
    name,
    phone: state.phone || '',
    vehicleId: state.driverVehicleId,
    plate: state.driverPlate.trim() || 'без номера',
    rating: 5,
    trips: 12,
    hue: 168,
    lat: 43.24,
    lng: 76.9,
  }
}

function advanceStatus(orderId: string) {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order) return
  const next = NEXT_STATUS[order.status]
  if (!next) return
  setOrderStatus(orderId, next)
}

function setOrderStatus(orderId: string, status: OrderStatus) {
  const now = new Date().toISOString()
  const labels: Record<OrderStatus, string> = {
    searching: 'Ищем водителя',
    accepted: 'Заказ принят',
    enroute_pickup: 'Водитель выехал к загрузке',
    loading: 'Идёт загрузка',
    enroute_drop: 'Груз в пути к выгрузке',
    delivered: 'Заказ доставлен',
    cancelled: 'Заказ отменён',
    rated: 'Спасибо за оценку',
  }
  patchOrder(orderId, (o) => ({
    ...o,
    status,
    statusHistory: [...o.statusHistory, { status, at: now }],
    messages: [
      ...o.messages,
      { id: uid('msg'), author: 'system', text: labels[status], createdAt: now },
    ],
  }))
  if (status === 'delivered' && state.role === 'client') {
    setState({ screen: { name: 'rating', orderId }, stack: [{ name: 'home' }] })
  }
}

function cancelOrder(orderId: string) {
  clearOffers(orderId)
  setOrderStatus(orderId, 'cancelled')
  setState((s) => ({
    ...s,
    currentOrderId: s.currentOrderId === orderId ? null : s.currentOrderId,
    screen: s.role === 'driver' ? { name: 'driver' } : { name: 'home' },
    stack: [],
  }))
}

function sendMessage(orderId: string, text: string, author?: 'client' | 'driver') {
  const trimmed = text.trim()
  if (!trimmed) return
  const who = author ?? (state.role === 'driver' ? 'driver' : 'client')
  const now = new Date().toISOString()
  patchOrder(orderId, (o) => ({
    ...o,
    messages: [...o.messages, { id: uid('msg'), author: who, text: trimmed, createdAt: now }],
  }))
}

function rateOrder(orderId: string, stars: number, comment: string) {
  const now = new Date().toISOString()
  patchOrder(orderId, (o) => ({
    ...o,
    status: 'rated',
    rating: { stars, comment: comment.trim(), at: now },
    statusHistory: [...o.statusHistory, { status: 'rated', at: now }],
  }))
  setState({
    currentOrderId: null,
    screen: { name: 'home' },
    stack: [],
  })
}

function resetDemo() {
  for (const id of offerTimers.keys()) clearOffers(id)
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  state = {
    ...initial,
    ready: true,
    seenWelcome: hasValidConsent(state.consent),
    name: state.name,
    phone: state.phone,
    driverVehicleId: state.driverVehicleId,
    driverPlate: state.driverPlate,
    consent: state.consent,
    auditLog: state.auditLog,
    subscription: defaultSubscription(),
    payments: [],
  }
  persist()
  emit()
}

function openOrder(orderId: string) {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order) return
  if (state.role === 'driver') {
    go({ name: 'driver-order', orderId })
    return
  }
  if (order.status === 'searching') go({ name: 'search', orderId })
  else if (order.status === 'delivered') go({ name: 'rating', orderId })
  else if (order.status === 'rated' || order.status === 'cancelled') go({ name: 'tracking', orderId })
  else go({ name: 'tracking', orderId })
}

export const actions = {
  go,
  back,
  setRole,
  welcome,
  updateProfile,
  exportMyData,
  withdrawConsent,
  deleteAccount,
  patchDraft,
  patchOptions,
  setVehicle,
  setPayment,
  setClientPrice,
  placeOrder,
  acceptOffer,
  driverOffer,
  takeOrder,
  advanceStatus,
  setOrderStatus,
  cancelOrder,
  sendMessage,
  rateOrder,
  resetDemo,
  openOrder,
  selfDriver,
  demoSelfDriverId,
  paySubscription,
  expireSubscriptionNow,
  previewExpiryInDays,
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function getState() {
  return state
}

export function useStore(): StoreState {
  return useSyncExternalStore(subscribe, getState, getState)
}

export function getStore(): StoreState {
  return state
}

if (typeof window !== 'undefined') {
  load()
}

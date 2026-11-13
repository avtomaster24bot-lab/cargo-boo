export type Role = 'client' | 'driver'

export type VehicleId =
  | 'kabluk'
  | 'gazelle'
  | 't3'
  | 't5'
  | 't10'
  | 'truck'
  | 'evac'

export type PaymentMethod = 'cash' | 'card' | 'kaspi'

export type TimeMode = 'now' | 'scheduled'

export type OrderStatus =
  | 'searching'
  | 'accepted'
  | 'enroute_pickup'
  | 'loading'
  | 'enroute_drop'
  | 'delivered'
  | 'cancelled'
  | 'rated'

export type ScreenName =
  | 'home'
  | 'address'
  | 'confirm'
  | 'search'
  | 'tracking'
  | 'history'
  | 'profile'
  | 'driver'
  | 'driver-order'
  | 'chat'
  | 'rating'
  | 'tariffs'

export interface GeoPoint {
  lat: number
  lng: number
  address: string
}

export interface Vehicle {
  id: VehicleId
  name: string
  hint: string
  capacity: string
  emoji: string
  baseFare: number
  perKm: number
  minFare: number
}

export interface OrderOptions {
  loaders: number
  packaging: boolean
  insurance: boolean
  urgent: boolean
  timeMode: TimeMode
  scheduledAt: string | null
}

export interface Offer {
  id: string
  driverId: string
  price: number
  etaMin: number
  createdAt: string
  kind: 'accept' | 'counter'
}

export interface ChatMessage {
  id: string
  author: 'client' | 'driver' | 'system'
  text: string
  createdAt: string
}

export interface Rating {
  stars: number
  comment: string
  at: string
}

export interface StatusEvent {
  status: OrderStatus
  at: string
}

export interface Order {
  id: string
  shortId: string
  createdAt: string
  pickup: GeoPoint
  dropoff: GeoPoint
  distanceKm: number
  durationMin: number
  route: [number, number][]
  vehicleId: VehicleId
  options: OrderOptions
  cargoDescription: string
  cargoPhoto?: string
  estimatedPrice: number
  clientPrice: number
  payment: PaymentMethod
  status: OrderStatus
  offers: Offer[]
  assignedDriverId?: string
  agreedPrice?: number
  messages: ChatMessage[]
  rating?: Rating
  statusHistory: StatusEvent[]
}

export interface Driver {
  id: string
  name: string
  phone: string
  vehicleId: VehicleId
  plate: string
  rating: number
  trips: number
  hue: number
  lat: number
  lng: number
}

export interface Draft {
  pickup: GeoPoint | null
  dropoff: GeoPoint | null
  distanceKm: number
  durationMin: number
  route: [number, number][]
  vehicleId: VehicleId
  options: OrderOptions
  cargoDescription: string
  cargoPhoto?: string
  estimatedPrice: number
  clientPrice: number
  payment: PaymentMethod
  routing: 'idle' | 'loading' | 'ready' | 'error'
}

export interface Screen {
  name: ScreenName
  orderId?: string
  addressTarget?: 'pickup' | 'dropoff'
}

export type PlanId = 'day' | 'week' | 'month'

export type SubscriptionKind = 'trial' | PlanId

export type SubPaymentMethod = 'kaspi' | 'card'

export interface DriverSubscription {
  kind: SubscriptionKind | null
  startedAt: string | null
  expiresAt: string | null
  trialUsed: boolean
}

export interface SubPayment {
  id: string
  planId: PlanId | 'trial'
  amount: number
  method: SubPaymentMethod | 'trial'
  createdAt: string
  periodStart: string
  periodEnd: string
  status: 'paid'
}

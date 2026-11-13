import { vehicleById } from '../data/vehicles'
import type { OrderOptions, VehicleId } from '../types'

export const LOADER_FEE = 2500
export const PACKAGING_FEE = 1500
export const INSURANCE_RATE = 0.03
export const INSURANCE_MIN = 2000
export const URGENT_RATE = 0.3

export interface PriceBreakdown {
  body: number
  loaders: number
  packaging: number
  insurance: number
  urgent: number
  total: number
}

function round100(n: number): number {
  return Math.max(100, Math.round(n / 100) * 100)
}

export function estimatePrice(
  vehicleId: VehicleId,
  distanceKm: number,
  options: OrderOptions,
): PriceBreakdown {
  const v = vehicleById(vehicleId)
  const distance = Math.max(0, distanceKm)
  const body = round100(Math.max(v.minFare, v.baseFare + v.perKm * distance))
  const loaders = options.loaders * LOADER_FEE
  const packaging = options.packaging ? PACKAGING_FEE : 0
  const subtotal = body + loaders + packaging
  const insurance = options.insurance
    ? round100(Math.max(INSURANCE_MIN, subtotal * INSURANCE_RATE))
    : 0
  const urgent = options.urgent ? round100(body * URGENT_RATE) : 0
  const total = round100(subtotal + insurance + urgent)
  return { body, loaders, packaging, insurance, urgent, total }
}

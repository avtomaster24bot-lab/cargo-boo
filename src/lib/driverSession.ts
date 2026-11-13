import type { Order, OrderStatus, Role } from '../types'

export const ACTIVE_DRIVER_STATUSES: OrderStatus[] = [
  'accepted',
  'enroute_pickup',
  'loading',
  'enroute_drop',
]

export function isActiveDriverStatus(status: OrderStatus): boolean {
  return ACTIVE_DRIVER_STATUSES.includes(status)
}

export function findActiveDriverOrder(
  orders: Order[],
  role: Role,
  driverId: string,
): Order | undefined {
  if (role !== 'driver') return undefined
  return orders.find((o) => o.assignedDriverId === driverId && isActiveDriverStatus(o.status))
}

let stayOpenPromptOrderId: string | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

export function queueStayOpenPrompt(orderId: string) {
  stayOpenPromptOrderId = orderId
  emit()
}

export function peekStayOpenPrompt(): string | null {
  return stayOpenPromptOrderId
}

export function clearStayOpenPrompt() {
  stayOpenPromptOrderId = null
  emit()
}

export function subscribeStayOpen(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

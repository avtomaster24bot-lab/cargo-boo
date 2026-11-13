import type { OrderStatus } from '../types'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  searching: 'Ищем водителя',
  accepted: 'Принят',
  enroute_pickup: 'В пути к загрузке',
  loading: 'Загрузка',
  enroute_drop: 'В пути к выгрузке',
  delivered: 'Доставлено',
  cancelled: 'Отменён',
  rated: 'Оценён',
}

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted: 'enroute_pickup',
  enroute_pickup: 'loading',
  loading: 'enroute_drop',
  enroute_drop: 'delivered',
}

export const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  accepted: 'Выехал к загрузке',
  enroute_pickup: 'Начал загрузку',
  loading: 'Вёзём к выгрузке',
  enroute_drop: 'Доставил',
}

export const TIMELINE: OrderStatus[] = [
  'accepted',
  'enroute_pickup',
  'loading',
  'enroute_drop',
  'delivered',
]

export function statusIndex(status: OrderStatus): number {
  if (status === 'rated') return TIMELINE.length - 1
  const i = TIMELINE.indexOf(status)
  return i
}

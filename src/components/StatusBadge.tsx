import { STATUS_LABELS } from '../lib/status'
import type { OrderStatus } from '../types'

const TONE: Record<OrderStatus, string> = {
  searching: 'bg-amber-100 text-amber-800',
  accepted: 'bg-mint text-teal-dark',
  enroute_pickup: 'bg-mint text-teal-dark',
  loading: 'bg-sky-100 text-sky-800',
  enroute_drop: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-stone-200 text-stone-600',
  rated: 'bg-emerald-100 text-emerald-800',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${TONE[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

import { Phone } from 'lucide-react'
import { isOrderPhoneVisible, maskPhone } from '../lib/privacy'
import type { OrderStatus } from '../types'

export function ContactPhone({
  phone,
  status,
  label,
}: {
  phone: string
  status: OrderStatus
  label?: string
}) {
  if (!phone) return null
  const open = isOrderPhoneVisible(status)
  if (open) {
    const href = `tel:${phone.replace(/\s/g, '')}`
    return (
      <a
        href={href}
        className="inline-flex items-center gap-1 font-semibold text-teal-dark"
        aria-label={label ?? 'Позвонить'}
      >
        <Phone size={16} />
        {phone}
      </a>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-ink-soft" title="Номер скрыт до принятия заказа и после его завершения">
      <Phone size={16} />
      {maskPhone(phone)}
    </span>
  )
}

export function CallButton({ phone, status, ariaLabel }: { phone: string; status: OrderStatus; ariaLabel?: string }) {
  if (!phone || !isOrderPhoneVisible(status)) return null
  return (
    <a
      href={`tel:${phone.replace(/\s/g, '')}`}
      className="grid h-10 w-10 place-items-center rounded-full bg-mint text-teal-dark"
      aria-label={ariaLabel ?? 'Позвонить'}
    >
      <Phone size={18} />
    </a>
  )
}

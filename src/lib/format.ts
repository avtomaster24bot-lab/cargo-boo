export function tenge(value: number): string {
  const rounded = Math.round(value)
  return `${rounded.toLocaleString('ru-RU')} ₸`
}

export function km(value: number): string {
  if (value < 1) return `${Math.round(value * 1000)} м`
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} км`
}

export function minutes(value: number): string {
  const m = Math.max(1, Math.round(value))
  if (m < 60) return `${m} мин`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest ? `${h} ч ${rest} мин` : `${h} ч`
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-KZ', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Almaty',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-KZ', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Almaty',
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-KZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Almaty',
  })
}

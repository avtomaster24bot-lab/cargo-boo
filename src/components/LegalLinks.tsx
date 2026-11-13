import { legalUrl } from '../lib/privacy'

export function LegalLinks({ className = '', light = false }: { className?: string; light?: boolean }) {
  const tone = light
    ? 'text-white/55 hover:text-white'
    : 'text-ink-soft hover:text-navy'
  return (
    <nav className={`flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold ${className}`}>
      <a className={tone} href={legalUrl('privacy')}>
        Политика конфиденциальности
      </a>
      <a className={tone} href={legalUrl('terms')}>
        Пользовательское соглашение
      </a>
    </nav>
  )
}

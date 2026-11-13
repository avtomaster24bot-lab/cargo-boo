import { useEffect, type ReactNode } from 'react'
import { LegalLinks } from '../components/LegalLinks'
import { LEGAL_DRAFT_NOTICE } from '../lib/privacy'

export function LegalLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  const home = import.meta.env.BASE_URL
  useEffect(() => {
    document.title = `${title} — Vezu`
    return () => {
      document.title = 'Vezu — грузоперевозки в один тап'
    }
  }, [title])
  return (
    <div className="min-h-full bg-cream px-4 pb-16">
      <header className="safe-top py-4">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-dark">Vezu</p>
        <h1 className="font-display mt-1 text-2xl font-extrabold leading-tight">{title}</h1>
        <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
      </header>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
        {LEGAL_DRAFT_NOTICE}
      </div>
      <article className="prose-legal mt-5 space-y-4 text-sm leading-relaxed text-ink">{children}</article>
      <div className="mt-8 space-y-3">
        <LegalLinks />
        <a href={home} className="cta inline-flex">
          Вернуться в приложение
        </a>
      </div>
    </div>
  )
}

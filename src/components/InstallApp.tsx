import { Download, Share, Plus, X, MoreVertical } from 'lucide-react'
import { useMemo, useState, useSyncExternalStore } from 'react'
import {
  currentInstallHelp,
  dismissInstallBanner,
  getDeferredPrompt,
  isBannerDismissed,
  isStandaloneDisplay,
  promptNativeInstall,
  subscribeInstall,
  type InstallHelpKind,
} from '../lib/install'

function installFlags(): string {
  return `${isStandaloneDisplay() ? '1' : '0'}${isBannerDismissed() ? '1' : '0'}${getDeferredPrompt() ? '1' : '0'}`
}

function useInstallSnapshot() {
  const flags = useSyncExternalStore(subscribeInstall, installFlags, installFlags)
  return {
    standalone: flags[0] === '1',
    dismissed: flags[1] === '1',
    canPrompt: flags[2] === '1',
  }
}

function IosShareIcon() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint text-teal-dark" aria-hidden>
      <Share size={18} />
    </span>
  )
}

function IosHomeIcon() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint text-teal-dark" aria-hidden>
      <Plus size={18} />
    </span>
  )
}

function ChromeMenuIcon() {
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint text-teal-dark" aria-hidden>
      <MoreVertical size={18} />
    </span>
  )
}

export function InstallHelp({
  kind,
  onClose,
}: {
  kind: InstallHelpKind
  onClose: () => void
}) {
  if (!kind) return null
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-navy/50 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="install-help-title">
      <div className="w-full max-w-sm rounded-3xl bg-paper p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <h2 id="install-help-title" className="font-display text-lg font-extrabold">
            Установить Vezu
          </h2>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-full bg-cream" onClick={onClose} aria-label="Закрыть">
            <X size={16} />
          </button>
        </div>
        {kind === 'ios-other' && (
          <p className="mt-3 text-sm leading-relaxed">
            На iPhone и iPad установку нужно делать через Safari. Откройте этот сайт в Safari, затем
            добавьте его на экран «Домой».
          </p>
        )}
        {(kind === 'ios-safari' || kind === 'ios-other') && (
          <ol className="mt-4 space-y-3 text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <IosShareIcon />
              <span>
                Нажмите кнопку <span className="font-extrabold">«Поделиться»</span> внизу Safari
                (квадрат со стрелкой вверх).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <IosHomeIcon />
              <span>
                Пролистайте меню и выберите <span className="font-extrabold">«На экран Домой»</span>,
                затем «Добавить».
              </span>
            </li>
          </ol>
        )}
        {kind === 'android-menu' && (
          <ol className="mt-4 space-y-3 text-sm leading-relaxed">
            <li className="flex items-start gap-3">
              <ChromeMenuIcon />
              <span>
                Откройте меню браузера <span className="font-extrabold">⋮</span> в правом верхнем углу.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint text-teal-dark" aria-hidden>
                <Download size={18} />
              </span>
              <span>
                Нажмите <span className="font-extrabold">«Установить приложение»</span> или «Добавить
                на главный экран».
              </span>
            </li>
          </ol>
        )}
        <button type="button" className="cta mt-5" onClick={onClose}>
          Понятно
        </button>
      </div>
    </div>
  )
}

export async function runInstallFlow(
  setHelp: (kind: InstallHelpKind) => void,
): Promise<void> {
  const outcome = await promptNativeInstall()
  if (outcome === 'accepted') return
  setHelp(currentInstallHelp())
}

export function InstallBanner({ hidden }: { hidden?: boolean }) {
  const { standalone, dismissed, canPrompt } = useInstallSnapshot()
  const [help, setHelp] = useState<InstallHelpKind>(null)
  const [gone, setGone] = useState(dismissed)
  if (hidden || standalone || gone) {
    return help ? <InstallHelp kind={help} onClose={() => setHelp(null)} /> : null
  }

  return (
    <>
      <div className="border-t border-line bg-navy px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-teal px-3 py-2 text-sm font-extrabold text-white"
            onClick={() => void runInstallFlow(setHelp)}
          >
            <Download size={16} />
            Установить Vezu
          </button>
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10"
            aria-label="Скрыть"
            onClick={() => {
              dismissInstallBanner()
              setGone(true)
            }}
          >
            <X size={16} />
          </button>
        </div>
        {!canPrompt && (
          <p className="mt-1 px-1 text-[11px] leading-snug text-white/70">
            Можно добавить на главный экран телефона и открывать как приложение.
          </p>
        )}
      </div>
      <InstallHelp kind={help} onClose={() => setHelp(null)} />
    </>
  )
}

export function InstallButton({ light = false }: { light?: boolean }) {
  const { standalone } = useInstallSnapshot()
  const [help, setHelp] = useState<InstallHelpKind>(null)
  const className = useMemo(
    () =>
      light
        ? 'flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-extrabold text-white'
        : 'cta',
    [light],
  )
  if (standalone) return null
  return (
    <>
      <button type="button" className={className} onClick={() => void runInstallFlow(setHelp)}>
        <Download size={18} />
        Установить Vezu
      </button>
      <InstallHelp kind={help} onClose={() => setHelp(null)} />
    </>
  )
}

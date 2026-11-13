export const INSTALL_BANNER_KEY = 'vezu-install-banner-v1'

export const STAY_OPEN_MESSAGE =
  'Не закрывайте приложение, пока заказ выполняется — иначе клиент не увидит ваше местоположение и вы можете пропустить сообщения'

export const STAY_OPEN_TOAST = 'Заказ ещё выполняется — не закрывайте приложение'

export type InstallHelpKind = 'ios-safari' | 'ios-other' | 'android-menu' | null

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function isStandaloneDisplay(
  mediaMatches = (query: string) =>
    typeof window !== 'undefined' && window.matchMedia?.(query).matches,
  navStandalone = typeof navigator !== 'undefined' &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
): boolean {
  return (
    navStandalone ||
    mediaMatches('(display-mode: standalone)') ||
    mediaMatches('(display-mode: fullscreen)') ||
    mediaMatches('(display-mode: minimal-ui)')
  )
}

export function isIosUserAgent(ua: string, maxTouchPoints = 0, platform = ''): boolean {
  if (/iPad|iPhone|iPod/.test(ua)) return true
  // iPadOS 13+ often reports as Macintosh with touch
  return platform === 'MacIntel' && maxTouchPoints > 1
}

export function isIosSafariUserAgent(ua: string, maxTouchPoints = 0, platform = ''): boolean {
  if (!isIosUserAgent(ua, maxTouchPoints, platform)) return false
  if (/CriOS|FxiOS|EdgiOS|OPiOS|YaApp|YaBrowser|FBAN|FBAV|Instagram|Line\//i.test(ua)) {
    return false
  }
  return /Safari/i.test(ua) || (/AppleWebKit/i.test(ua) && !/Chrome|Chromium|Android/i.test(ua))
}

export function isBannerDismissed(storage?: Pick<Storage, 'getItem'> | null): boolean {
  try {
    return (storage ?? (typeof localStorage !== 'undefined' ? localStorage : null))?.getItem(INSTALL_BANNER_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissInstallBanner(storage?: Pick<Storage, 'setItem'> | null) {
  try {
    (storage ?? (typeof localStorage !== 'undefined' ? localStorage : null))?.setItem(INSTALL_BANNER_KEY, '1')
  } catch {
    /* ignore quota */
  }
  emit()
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((fn) => fn())
}

export function getDeferredPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt
}

export function initInstallCapture() {
  if (typeof window === 'undefined') return
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredPrompt = event as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    emit()
  })
  const media = window.matchMedia?.('(display-mode: standalone)')
  media?.addEventListener?.('change', () => emit())
}

export function subscribeInstall(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export async function promptNativeInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) return 'unavailable'
  const event = deferredPrompt
  deferredPrompt = null
  emit()
  await event.prompt()
  const { outcome } = await event.userChoice
  return outcome
}

export function currentInstallHelp(ua?: string): InstallHelpKind {
  const agent = ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')
  const touch = typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0
  const platform = typeof navigator !== 'undefined' ? navigator.platform : ''
  if (isIosUserAgent(agent, touch, platform)) {
    return isIosSafariUserAgent(agent, touch, platform) ? 'ios-safari' : 'ios-other'
  }
  return 'android-menu'
}

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { STAY_OPEN_MESSAGE, STAY_OPEN_TOAST } from '../lib/install'
import {
  clearStayOpenPrompt,
  findActiveDriverOrder,
  peekStayOpenPrompt,
  subscribeStayOpen,
} from '../lib/driverSession'
import { actions, useStore } from '../store'

function promptSnapshot() {
  return peekStayOpenPrompt()
}

export function useDriverKeepAwake(active: boolean, onReturnFromBackground?: () => void) {
  const hiddenRef = useRef(false)
  const returnCb = useRef(onReturnFromBackground)

  useEffect(() => {
    returnCb.current = onReturnFromBackground
  }, [onReturnFromBackground])

  useEffect(() => {
    if (!active) return

    let lock: WakeLockSentinel | null = null
    let released = false

    async function acquire() {
      if (released) return
      try {
        if ('wakeLock' in navigator) {
          lock = await navigator.wakeLock.request('screen')
          lock.addEventListener('release', () => {
            if (!released && document.visibilityState === 'visible') {
              void acquire()
            }
          })
        }
      } catch {
        /* браузер или политика страницы не разрешили */
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') {
        void acquire()
        if (hiddenRef.current) returnCb.current?.()
        hiddenRef.current = false
      } else {
        hiddenRef.current = true
      }
    }

    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = STAY_OPEN_MESSAGE
    }

    void acquire()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      released = true
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onBeforeUnload)
      void lock?.release()
    }
  }, [active])
}

export function DriverStayOpen() {
  const { role, orders } = useStore()
  const promptId = useSyncExternalStore(subscribeStayOpen, promptSnapshot, promptSnapshot)
  const active = findActiveDriverOrder(orders, role, actions.demoSelfDriverId())
  const [toast, setToast] = useState(false)
  const toastTimer = useRef<number | null>(null)

  useDriverKeepAwake(Boolean(active), () => {
    setToast(true)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(false), 4500)
  })

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
    }
  }, [])

  const showModal = Boolean(promptId && active && promptId === active.id)

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-navy/55 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="stay-open-title">
          <div className="w-full max-w-sm rounded-3xl bg-paper p-5 shadow-xl">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-dark">Напоминание водителю</p>
            <h2 id="stay-open-title" className="font-display mt-2 text-xl font-extrabold">
              Заказ принят
            </h2>
            <p className="mt-3 text-sm leading-relaxed">⚠️ {STAY_OPEN_MESSAGE}</p>
            <button
              type="button"
              className="cta mt-5"
              onClick={() => clearStayOpenPrompt()}
            >
              Понятно
            </button>
          </div>
        </div>
      )}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4">
          <div className="max-w-sm rounded-2xl bg-navy px-4 py-3 text-sm font-semibold leading-snug text-white shadow-lg ring-2 ring-teal">
            ⚠️ {STAY_OPEN_TOAST}
          </div>
        </div>
      )}
    </>
  )
}

export function DriverStayOpenBanner() {
  return (
    <div className="sticky top-0 z-20 -mx-4 mb-3 border-b-2 border-teal bg-navy px-4 py-3 text-white shadow-md">
      <p className="text-sm font-bold leading-snug">⚠️ {STAY_OPEN_MESSAGE}</p>
    </div>
  )
}


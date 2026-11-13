import assert from 'node:assert/strict'
import {
  currentInstallHelp,
  dismissInstallBanner,
  INSTALL_BANNER_KEY,
  isBannerDismissed,
  isIosSafariUserAgent,
  isIosUserAgent,
  isStandaloneDisplay,
} from './install.ts'
import { findActiveDriverOrder, isActiveDriverStatus } from './driverSession.ts'
import type { Order } from '../types.ts'

assert.equal(isStandaloneDisplay(() => false, false), false)
assert.equal(isStandaloneDisplay((q) => q.includes('standalone'), false), true)
assert.equal(isStandaloneDisplay(() => false, true), true)

const iphoneSafari =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
const iphoneChrome =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1'
const androidChrome =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

assert.equal(isIosUserAgent(iphoneSafari), true)
assert.equal(isIosUserAgent(androidChrome), false)
assert.equal(isIosSafariUserAgent(iphoneSafari), true)
assert.equal(isIosSafariUserAgent(iphoneChrome), false)
assert.equal(currentInstallHelp(iphoneSafari), 'ios-safari')
assert.equal(currentInstallHelp(iphoneChrome), 'ios-other')
assert.equal(currentInstallHelp(androidChrome), 'android-menu')

const mem = new Map<string, string>()
const storage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => {
    mem.set(k, v)
  },
}
assert.equal(isBannerDismissed(storage), false)
dismissInstallBanner(storage)
assert.equal(mem.get(INSTALL_BANNER_KEY), '1')
assert.equal(isBannerDismissed(storage), true)

assert.equal(isActiveDriverStatus('accepted'), true)
assert.equal(isActiveDriverStatus('enroute_drop'), true)
assert.equal(isActiveDriverStatus('delivered'), false)
assert.equal(isActiveDriverStatus('searching'), false)
assert.equal(isActiveDriverStatus('cancelled'), false)

const order = { id: 'o1', assignedDriverId: 'drv-self', status: 'accepted' } as Order
assert.equal(findActiveDriverOrder([order], 'driver', 'drv-self')?.id, 'o1')
assert.equal(findActiveDriverOrder([order], 'client', 'drv-self'), undefined)
assert.equal(findActiveDriverOrder([{ ...order, status: 'rated' } as Order], 'driver', 'drv-self'), undefined)

console.log('install and driver-session tests passed')

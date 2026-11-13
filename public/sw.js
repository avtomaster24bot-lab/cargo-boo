const CACHE = 'vezu-shell-v2'
const PRECACHE = [
  '/cargo-boo/',
  '/cargo-boo/index.html',
  '/cargo-boo/manifest.webmanifest',
  '/cargo-boo/favicon.svg',
  '/cargo-boo/icon-192.png',
  '/cargo-boo/icon-512.png',
  '/cargo-boo/icon-192-maskable.png',
  '/cargo-boo/icon-512-maskable.png',
  '/cargo-boo/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return
  event.respondWith(
    caches.match(req).then((hit) => {
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok && url.pathname.startsWith('/cargo-boo/')) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
          }
          return res
        })
        .catch(() => hit)
      return hit || fresh
    }),
  )
})

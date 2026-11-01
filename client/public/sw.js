// App shell: cache-first for static assets, network-first for API GETs (falls back to the last copy offline).
// The event stream is never cached.
const CACHE = 'df-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest', '/icon.svg'])))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.pathname.startsWith('/api/events/stream')) return

  const save = (res) => {
    if (res.ok) {
      const copy = res.clone()
      caches.open(CACHE).then((c) => c.put(req, copy))
    }
    return res
  }

  if (url.pathname.startsWith('/api/') || req.mode === 'navigate') {
    // SPA routes all resolve to the cached shell when offline.
    const fallback = req.mode === 'navigate' ? '/' : req
    e.respondWith(fetch(req).then(save).catch(() => caches.match(fallback)))
    return
  }
  e.respondWith(caches.match(req).then((hit) => hit ?? fetch(req).then(save)))
})

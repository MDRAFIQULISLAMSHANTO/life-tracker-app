// Livio Service Worker — notifications + PWA offline cache

const CACHE = 'livio-v2'
const OFFLINE_URLS = ['/', '/dashboard']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(OFFLINE_URLS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  // Network-first for API/Firestore, cache-first for static assets
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('firestore') || e.request.url.includes('googleapis')) return
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})

// Local notification triggered from client via postMessage
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag, url } = e.data
    e.waitUntil(
      self.registration.showNotification(title || 'Livio', {
        body: body || '',
        icon: '/logo/livio-icon.svg',
        badge: '/logo/livio-icon.svg',
        tag: tag || 'livio-notif',
        renotify: true,
        data: { url: url || '/dashboard' },
        actions: [{ action: 'open', title: 'Open' }],
      })
    )
  }
})

// Push from server (future)
self.addEventListener('push', (e) => {
  const data = e.data?.json?.() || {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'Livio', {
      body: data.body || '',
      icon: '/logo/livio-icon.svg',
      badge: '/logo/livio-icon.svg',
      data: { url: data.url || '/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = e.notification.data?.url || '/dashboard'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes('/dashboard'))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})

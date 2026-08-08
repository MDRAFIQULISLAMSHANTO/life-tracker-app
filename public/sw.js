// Livio Service Worker — offline shell, asset cache, local notifications

const VERSION = 'livio-v3'
const SHELL_CACHE = `${VERSION}-shell`
const ASSET_CACHE = `${VERSION}-assets`
const OFFLINE_URL = '/offline'
const SHELL_URLS = ['/', '/dashboard', OFFLINE_URL]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll rejects the whole batch if any single URL 404s, which would
      // leave the SW permanently uninstalled. Add them independently instead.
      .then((c) => Promise.all(SHELL_URLS.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

function isAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/logo/') ||
    /\.(png|jpg|jpeg|svg|webp|woff2?|ttf|css|js)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (url.href.includes('firestore') || url.href.includes('googleapis')) return

  // Navigations: network-first, fall back to the cached page, then /offline.
  // The previous implementation never wrote to the cache, so the fallback was
  // almost always undefined — which iOS renders as its own error page.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {})
          return res
        })
        .catch(async () => {
          const cached = await caches.match(req)
          if (cached) return cached
          const shell = await caches.match('/dashboard')
          if (shell) return shell
          return (
            (await caches.match(OFFLINE_URL)) ||
            new Response('<h1>Offline</h1><p>Reconnect and reopen Livio.</p>', {
              headers: { 'Content-Type': 'text/html' },
              status: 503,
            })
          )
        })
    )
    return
  }

  // Static assets: cache-first, revalidate in the background.
  if (isAsset(url)) {
    e.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone()
              caches.open(ASSET_CACHE).then((c) => c.put(req, copy)).catch(() => {})
            }
            return res
          })
          .catch(() => cached)
        return cached || network
      })
    )
    return
  }

  // Everything else: network, with a cached copy as a safety net.
  e.respondWith(fetch(req).catch(() => caches.match(req)))
})

function showLivioNotification({ title, body, tag, url }) {
  // renotify is invalid without a tag, and iOS silently drops such notifications
  const safeTag = tag || `livio-${Date.now()}`
  return self.registration.showNotification(title || 'Livio', {
    body: body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: safeTag,
    renotify: true,
    requireInteraction: false,
    data: { url: url || '/dashboard' },
  })
}

// Local notification triggered from the client via postMessage
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SHOW_NOTIFICATION') {
    e.waitUntil(showLivioNotification(e.data))
  }
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// Push from server (future — needs FCM/VAPID)
self.addEventListener('push', (e) => {
  let data = {}
  try {
    data = e.data?.json() || {}
  } catch {
    data = { body: e.data?.text?.() || '' }
  }
  e.waitUntil(showLivioNotification(data))
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const target = e.notification.data?.url || '/dashboard'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes('/dashboard')) {
          c.focus()
          if ('navigate' in c) c.navigate(target).catch(() => {})
          return
        }
      }
      return self.clients.openWindow(target)
    })
  )
})

'use client'

/**
 * Live shared content: the daily morning quote and the study library.
 *
 * Unlike the per-user contexts, this is read-only on the client — firestore
 * rules deny every client write under `content/**`, and all authoring goes
 * through the API routes. So there is no write debounce, no seed-on-empty and
 * no remoteReady gate here; just two listeners and a local cache for offline.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { db } from '../lib/firebase'
import { LIBRARY_COLLECTION, QUOTES_COLLECTION, appDateKey } from '../lib/contentPaths'

const QUOTE_CACHE_KEY = 'livio_daily_quote_v1'
const LIBRARY_CACHE_KEY = 'livio_content_library_v1'

/** Shown when the quote has never loaded and generation is unavailable. */
const FALLBACK_QUOTES = [
  { text: 'Five minutes beats zero. Do the small version today.', author: null, theme: 'Consistency' },
  { text: 'Discipline is choosing what you want most over what you want now.', author: null, theme: 'Focus' },
  { text: 'You do not rise to your goals — you fall to your systems.', author: 'James Clear', theme: 'Habits' },
  { text: 'Spend less than you earn, and put the gap to work. Everything else is detail.', author: null, theme: 'Money' },
]

function fallbackQuoteFor(dateKey) {
  // Deterministic per day, so it doesn't flicker between renders or tabs.
  const n = dateKey.split('-').reduce((sum, part) => sum + Number(part), 0)
  return FALLBACK_QUOTES[n % FALLBACK_QUOTES.length]
}

function readCache(key, fallback) {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeCache(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota — the cloud copy is authoritative anyway
  }
}

/**
 * Subscribe with the same resilience the per-user sync uses: retry with backoff
 * on error, and re-attach when the app returns to the foreground (mobile/PWA
 * freezes the JS context and the realtime channel can die silently).
 *
 * @param {() => import('firebase/firestore').Query | import('firebase/firestore').DocumentReference | null} buildRef
 * @param {(snap: any) => void} onSnap
 */
function subscribeResilient(buildRef, onSnap, label) {
  const ref = buildRef()
  if (!ref) return () => {}

  let active = true
  let unsub = null
  let retryTimer = null
  let retries = 0
  const RETRY_DELAYS = [3000, 8000, 20000]

  function attach() {
    unsub = onSnapshot(
      ref,
      (snap) => {
        retries = 0
        onSnap(snap)
      },
      (err) => {
        console.warn(`[content] ${label} listener error, will retry:`, err?.message || err)
        if (!active) return
        const delay = RETRY_DELAYS[Math.min(retries, RETRY_DELAYS.length - 1)]
        retries += 1
        retryTimer = setTimeout(() => {
          if (!active) return
          unsub?.()
          attach()
        }, delay)
      }
    )
  }

  let reattachLock = false
  const reattach = () => {
    if (!active || reattachLock) return
    reattachLock = true
    setTimeout(() => {
      reattachLock = false
    }, 500)
    clearTimeout(retryTimer)
    retries = 0
    unsub?.()
    attach()
  }
  const onVisible = () => {
    if (document.visibilityState === 'visible') reattach()
  }

  attach()
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('pageshow', reattach)

  return () => {
    active = false
    clearTimeout(retryTimer)
    unsub?.()
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('pageshow', reattach)
  }
}

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.uid || null

  // Start empty so server HTML matches the first client render; caches are read
  // after mount, like the per-user contexts (avoids hydration error #418).
  const [quote, setQuote] = useState(null)
  const [pages, setPages] = useState([])
  const [dateKey, setDateKey] = useState(() => appDateKey())
  const [quoteLoading, setQuoteLoading] = useState(true)
  const requestedForRef = useRef(null)

  useEffect(() => {
    const cached = readCache(QUOTE_CACHE_KEY, null)
    if (cached?.dateKey === appDateKey()) setQuote(cached)
    setPages(readCache(LIBRARY_CACHE_KEY, []))
  }, [])

  // The app can stay open past midnight — roll the key over rather than showing
  // yesterday's quote until the next reload.
  useEffect(() => {
    const id = setInterval(() => {
      const next = appDateKey()
      setDateKey((prev) => (prev === next ? prev : next))
    }, 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const requestGeneration = useCallback(async () => {
    if (!user) return
    // One attempt per day per session — a failing key shouldn't be retried on
    // every snapshot, and the next visitor will trigger it anyway.
    if (requestedForRef.current === dateKey) return
    requestedForRef.current = dateKey
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/daily-quote', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.warn('[content] daily quote unavailable:', body?.error || res.status)
      }
      // On success the onSnapshot listener delivers the doc — nothing to do here.
    } catch (e) {
      console.warn('[content] daily quote request failed:', e?.message || e)
    } finally {
      setQuoteLoading(false)
    }
  }, [user, dateKey])

  useEffect(() => {
    if (!db || !uid) return () => {}
    setQuoteLoading(true)
    return subscribeResilient(
      () => doc(db, ...QUOTES_COLLECTION, dateKey),
      (snap) => {
        if (snap.exists()) {
          const data = { ...snap.data(), dateKey }
          setQuote(data)
          setQuoteLoading(false)
          writeCache(QUOTE_CACHE_KEY, data)
          return
        }
        // Nobody has generated today's quote yet — ask the server to.
        requestGeneration()
      },
      'daily-quote'
    )
  }, [uid, dateKey, requestGeneration])

  useEffect(() => {
    if (!db || !uid) return () => {}
    return subscribeResilient(
      () => query(collection(db, ...LIBRARY_COLLECTION), where('published', '==', true)),
      (snap) => {
        const next = snap.docs
          .map((d) => d.data())
          // Ordered here rather than with orderBy so the query needs no
          // composite index alongside the `published` filter.
          .sort(
            (a, b) =>
              (a.order ?? 0) - (b.order ?? 0) ||
              String(a.title || '').localeCompare(String(b.title || ''))
          )
        setPages(next)
        writeCache(LIBRARY_CACHE_KEY, next)
      },
      'library'
    )
  }, [uid])

  const value = useMemo(() => {
    const pageBySlug = {}
    pages.forEach((p) => {
      if (p?.slug) pageBySlug[p.slug] = p
    })
    const pageGroups = new Map()
    pages.forEach((p) => {
      const key = p.group || 'Reference'
      if (!pageGroups.has(key)) pageGroups.set(key, [])
      pageGroups.get(key).push(p)
    })
    return {
      quote: quote || fallbackQuoteFor(dateKey),
      quoteIsFallback: !quote,
      quoteLoading: quoteLoading && !quote,
      dateKey,
      pages,
      pageBySlug,
      pageGroups: Array.from(pageGroups.entries()),
    }
  }, [quote, quoteLoading, dateKey, pages])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used within ContentProvider')
  return ctx
}

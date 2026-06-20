/**
 * Firestore helpers for per-user synced documents.
 * Paths: users/{uid}/liver/finance | users/{uid}/liver/dashboardToday
 */
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export function userDocRef(userId, ...pathSegments) {
  if (!db || !userId) return null
  return doc(db, 'users', userId, ...pathSegments)
}

/**
 * @param {object} opts
 * @param {string} opts.userId
 * @param {string[]} opts.pathSegments e.g. ['liver', 'finance']
 * @param {(info: { exists: boolean, payload?: object }) => void} opts.onRemote
 * @param {(e: Error) => void} [opts.onError]
 * @returns {() => void} unsubscribe
 */
export function subscribeUserPayloadDoc({ userId, pathSegments, onRemote, onError }) {
  const docRef = userDocRef(userId, ...pathSegments)
  if (!docRef) return () => {}

  let active = true
  let retryTimer = null
  let currentUnsub = null

  const RETRY_DELAYS = [3000, 8000, 20000] // 3s, 8s, 20s
  let retryCount = 0

  function attach() {
    // No includeMetadataChanges: we only want real data changes. Metadata-only
    // churn (fromCache/pendingWrites toggles) previously fired setState on every
    // tick and could revert a just-made local edit.
    currentUnsub = onSnapshot(
      docRef,
      (snap) => {
        retryCount = 0 // reset backoff on successful snapshot
        const { hasPendingWrites, fromCache } = snap.metadata
        console.info('[sync] snapshot', pathSegments.join('/'), {
          exists: snap.exists(), fromCache, hasPendingWrites,
        })
        if (hasPendingWrites) return
        if (!snap.exists()) {
          onRemote({ exists: false })
          return
        }
        const data = snap.data()
        onRemote({ exists: true, payload: data?.payload ?? null })
      },
      (err) => {
        console.warn('[Firestore sync] connection error, will retry:', err?.message || err)
        onError?.(err)
        if (!active) return
        const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)]
        retryCount++
        retryTimer = setTimeout(() => {
          if (!active) return
          currentUnsub?.()
          attach()
        }, delay)
      }
    )
  }

  // Mobile/PWA freezes the JS context while backgrounded; the Firestore realtime
  // channel can die and then fail to redeliver remote changes after resume —
  // which looks like "other devices' edits never reach the PWA". Re-attaching the
  // listener on foreground forces a fresh server snapshot. Debounced so the
  // visibilitychange + pageshow pair (and rapid toggles) don't thrash.
  let reattachLock = false
  function reattach() {
    if (!active || reattachLock) return
    reattachLock = true
    setTimeout(() => { reattachLock = false }, 500)
    clearTimeout(retryTimer)
    retryCount = 0
    currentUnsub?.()
    attach()
  }

  const onVisible = () => {
    if (document.visibilityState === 'visible') reattach()
  }
  const onPageShow = () => reattach()

  attach()

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', onPageShow)
  }

  return () => {
    active = false
    clearTimeout(retryTimer)
    currentUnsub?.()
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', onPageShow)
    }
  }
}

export function writeUserPayloadDoc(userId, pathSegments, payload) {
  const path = pathSegments.join('/')
  const docRef = userDocRef(userId, ...pathSegments)
  if (!docRef) {
    console.warn('[sync] write skipped — no docRef (db or user missing)', { path, hasUser: !!userId })
    return Promise.resolve()
  }
  return setDoc(docRef, { payload, updatedAt: serverTimestamp() }, { merge: true })
    .then(() => {
      console.info('[sync] write ok', path)
    })
    .catch((e) => {
      // Surface the real cause — callers historically swallowed this with .catch(()=>{})
      console.error('[sync] write FAILED', path, e?.code || e?.message || e)
      throw e
    })
}

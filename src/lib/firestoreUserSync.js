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
    currentUnsub = onSnapshot(
      docRef,
      { includeMetadataChanges: true },
      (snap) => {
        retryCount = 0 // reset backoff on successful snapshot
        if (snap.metadata.hasPendingWrites) return
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

  attach()

  return () => {
    active = false
    clearTimeout(retryTimer)
    currentUnsub?.()
  }
}

export function writeUserPayloadDoc(userId, pathSegments, payload) {
  const docRef = userDocRef(userId, ...pathSegments)
  if (!docRef) return Promise.resolve()
  return setDoc(
    docRef,
    {
      payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

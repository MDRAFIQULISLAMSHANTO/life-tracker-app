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

  return onSnapshot(
    docRef,
    { includeMetadataChanges: true },
    (snap) => {
      if (snap.metadata.hasPendingWrites) return
      if (!snap.exists()) {
        onRemote({ exists: false })
        return
      }
      const data = snap.data()
      onRemote({ exists: true, payload: data?.payload ?? null })
    },
    (err) => {
      console.warn('[Firestore sync]', err?.message || err)
      onError?.(err)
    }
  )
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

'use client'

/**
 * Shoulder-surfing guard for money figures.
 *
 * The wallet card's eye used to hide only its own balance, which left every
 * other number on the dashboard — monthly income, net, recent transactions —
 * in plain sight. One toggle now drives all of them.
 *
 * Deliberately NOT part of the synced Firestore payload: this is a per-device
 * preference (you might want figures hidden on the laptop you use at work and
 * visible on your phone), so it lives in localStorage only, namespaced by
 * account like every other local cache.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { localCacheKey } from '../lib/firestoreUserSync'

const STORAGE_KEY = 'livio_amounts_revealed_v1'

/** What a masked figure looks like. */
export const MASK = '•••••'

const PrivacyContext = createContext(null)

export function PrivacyProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const uid = user?.uid || null

  // Hidden by default, and starts hidden on the server render too, so figures
  // can never flash before the preference loads.
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (authLoading) return
    try {
      setRevealed(window.localStorage.getItem(localCacheKey(STORAGE_KEY, uid)) === '1')
    } catch {
      setRevealed(false)
    }
  }, [uid, authLoading])

  const setAndPersist = useCallback(
    (next) => {
      setRevealed(next)
      try {
        window.localStorage.setItem(localCacheKey(STORAGE_KEY, uid), next ? '1' : '0')
      } catch {
        // private mode / quota — the toggle still works for this session
      }
    },
    [uid]
  )

  const toggleRevealed = useCallback(() => setAndPersist(!revealed), [revealed, setAndPersist])

  const value = useMemo(
    () => ({
      revealed,
      toggleRevealed,
      setRevealed: setAndPersist,
      /** Wrap any already-formatted money string. */
      mask: (formatted, placeholder = MASK) => (revealed ? formatted : placeholder),
    }),
    [revealed, toggleRevealed, setAndPersist]
  )

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
}

export function usePrivacy() {
  const ctx = useContext(PrivacyContext)
  if (!ctx) throw new Error('usePrivacy must be used within PrivacyProvider')
  return ctx
}

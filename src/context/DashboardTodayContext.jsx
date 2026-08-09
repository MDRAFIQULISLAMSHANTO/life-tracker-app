'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { localCacheKey, subscribeUserPayloadDoc, writeUserPayloadDoc } from '../lib/firestoreUserSync'
import { mergeOneTimeDemoToday, DEMO_TODAY_KEY } from '../lib/demoDashboardData'

const STORAGE_KEY = 'livio_dashboard_today_v1'
const FS_PATH = ['liver', 'dashboardToday']

function safeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `dt_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10)
}

function monthKeyFromParts(year, month1to12) {
  return `${year}-${String(month1to12).padStart(2, '0')}`
}

const emptyAgenda = () => ({
  events: [],
  reminders: [],
  notes: [],
})

function migrateLoadedState(parsed) {
  const t = todayISODate()
  const events = Array.isArray(parsed.events)
    ? parsed.events.map((e) => ({ ...e, date: e.date || t }))
    : []
  const reminders = Array.isArray(parsed.reminders)
    ? parsed.reminders.map((r) => ({ ...r, date: r.date || t }))
    : []
  const notes = Array.isArray(parsed.notes)
    ? parsed.notes.map((n) => ({
        ...n,
        date: n.date || (n.createdAt ? String(n.createdAt).slice(0, 10) : t),
      }))
    : []
  return { events, reminders, notes }
}

function loadFromStorage(uid) {
  if (typeof window === 'undefined') return emptyAgenda()
  try {
    const raw = window.localStorage.getItem(localCacheKey(STORAGE_KEY, uid))
    if (!raw) return emptyAgenda()
    return migrateLoadedState(JSON.parse(raw))
  } catch {
    return emptyAgenda()
  }
}

function normalizeRemotePayload(payload) {
  if (!payload || typeof payload !== 'object') return emptyAgenda()
  return migrateLoadedState({
    events: payload.events,
    reminders: payload.reminders,
    notes: payload.notes,
  })
}

const DashboardTodayContext = createContext(null)

export function DashboardTodayProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const uid = user?.uid || null
  // Start empty so server HTML matches first client render — localStorage is
  // read after mount (below) to avoid React hydration error #418.
  const [state, setState] = useState(emptyAgenda)
  const stateRef = useRef(state)
  const applyingRemoteRef = useRef(false)
  const seededCloudRef = useRef(false)
  const remoteReadyRef = useRef(false)
  const writeTimerRef = useRef(null)
  // Which account the in-memory state belongs to. Must be state, not a ref — a
  // ref flips synchronously inside the load effect and lets the persist effect
  // overwrite the cache with the empty initial state. `undefined` means "not
  // hydrated yet"; `null` is a legitimate value (signed out).
  const [hydratedUid, setHydratedUid] = useState(undefined)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Load the cache for the *current account*, after auth resolves. Re-runs on
  // every sign-in/sign-out, so one account's data can never be shown — or
  // written to the cloud — under another account on a shared browser.
  useEffect(() => {
    if (authLoading) return
    seededCloudRef.current = false
    remoteReadyRef.current = false
    applyingRemoteRef.current = false
    if (writeTimerRef.current) {
      clearTimeout(writeTimerRef.current)
      writeTimerRef.current = null
    }
    const loaded = loadFromStorage(uid)
    stateRef.current = loaded
    setState(loaded)
    setHydratedUid(uid)
  }, [uid, authLoading])

  useEffect(() => {
    // Never persist while the state still belongs to the previous account.
    if (hydratedUid === undefined || hydratedUid !== uid) return
    try {
      window.localStorage.setItem(localCacheKey(STORAGE_KEY, uid), JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state, uid, hydratedUid])

  useEffect(() => {
    if (!uid || hydratedUid !== uid) return () => {}
    const unsub = subscribeUserPayloadDoc({
      userId: uid,
      pathSegments: FS_PATH,
      onRemote: ({ exists, payload }) => {
        if (!exists) {
          remoteReadyRef.current = true
          if (!seededCloudRef.current) {
            seededCloudRef.current = true
            // Seed from an empty agenda, never from current state: this account
            // has no cloud doc yet, and anything in memory could still belong to
            // whoever used this browser last.
            // Promote this device's local cache into the first cloud doc — the
            // only migration path for events/reminders/notes that have so far
            // lived in IndexedDB alone. Safe because this effect only attaches
            // once `hydratedUid === uid`, so `stateRef.current` is guaranteed to
            // be THIS account's cache, never the previous user's.
            writeUserPayloadDoc(uid, FS_PATH, stateRef.current).catch(() => {})
          }
          return
        }
        remoteReadyRef.current = true
        if (payload) {
          // A local edit is queued (newer) — don't revert it with this snapshot.
          if (writeTimerRef.current) return
          let next = normalizeRemotePayload(payload)
          const demoKey = DEMO_TODAY_KEY(uid)
          if (
            typeof window !== 'undefined' &&
            !localStorage.getItem(demoKey) &&
            !next.events?.length &&
            !next.reminders?.length &&
            !next.notes?.length
          ) {
            next = mergeOneTimeDemoToday(next)
            localStorage.setItem(demoKey, '1')
          }
          // Already in sync — skip needless re-render + flag churn.
          if (JSON.stringify(next) === JSON.stringify(stateRef.current)) return
          applyingRemoteRef.current = true
          setState(next)
        }
      },
    })
    return unsub
  }, [uid, hydratedUid])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (uid || hydratedUid !== null) return
    const demoKey = DEMO_TODAY_KEY(null)
    if (localStorage.getItem(demoKey)) return
    setState((prev) => {
      if (prev.events?.length || prev.reminders?.length || prev.notes?.length) return prev
      localStorage.setItem(demoKey, '1')
      return mergeOneTimeDemoToday(prev)
    })
  }, [uid, hydratedUid])

  useEffect(() => {
    if (!uid || hydratedUid !== uid) return
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false
      return
    }
    // Don't write until Firestore has confirmed the doc state (exists or not)
    // — prevents overwriting real data with empty localStorage on login
    if (!remoteReadyRef.current) return
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(() => {
      writeTimerRef.current = null
      writeUserPayloadDoc(uid, FS_PATH, stateRef.current).catch(() => {})
    }, 450)
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    }
  }, [state, uid, hydratedUid])

  // Flush pending write immediately when the tab/app backgrounds or closes —
  // mobile suspends timers aggressively, so the 450ms debounce can otherwise be lost
  useEffect(() => {
    if (!uid || hydratedUid !== uid) return
    const flush = () => {
      if (!writeTimerRef.current) return
      clearTimeout(writeTimerRef.current)
      writeTimerRef.current = null
      writeUserPayloadDoc(uid, FS_PATH, stateRef.current).catch(() => {})
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
    }
  }, [uid, hydratedUid])

  const resetDashboardForMonth = useCallback((year, month1to12) => {
    const key = monthKeyFromParts(year, month1to12)
    setState((s) => ({
      events: s.events.filter((e) => !e.date || String(e.date).slice(0, 7) !== key),
      reminders: s.reminders.filter((r) => !r.date || String(r.date).slice(0, 7) !== key),
      notes: s.notes.filter((n) => !n.date || String(n.date).slice(0, 7) !== key),
    }))
  }, [])

  const addEvent = useCallback((payload) => {
    const title = String(payload?.title || '').trim()
    const time = String(payload?.time || '').trim()
    if (!title || !time) return { ok: false, error: 'Title and time are required.' }
    const link = String(payload?.link || '').trim()
    const date = payload?.date ? String(payload.date).slice(0, 10) : todayISODate()
    const item = { id: safeId(), title, time, link: link || '', date }
    setState((s) => ({ ...s, events: [item, ...s.events] }))
    return { ok: true }
  }, [])

  const deleteEvent = useCallback((id) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }))
  }, [])

  const addReminder = useCallback((payload) => {
    const title = String(payload?.title || '').trim()
    const time = String(payload?.time || '').trim()
    if (!title || !time) return { ok: false, error: 'Title and time are required.' }
    const link = String(payload?.link || '').trim()
    const date = payload?.date ? String(payload.date).slice(0, 10) : todayISODate()
    const item = { id: safeId(), title, time, completed: false, link: link || '', date }
    setState((s) => ({ ...s, reminders: [item, ...s.reminders] }))
    return { ok: true }
  }, [])

  const toggleReminder = useCallback((id) => {
    setState((s) => ({
      ...s,
      reminders: s.reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)),
    }))
  }, [])

  const deleteReminder = useCallback((id) => {
    setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }))
  }, [])

  const addNote = useCallback((payload) => {
    const content = String(payload?.content || '').trim()
    if (!content) return { ok: false, error: 'Note cannot be empty.' }
    const link = String(payload?.link || '').trim()
    const date = payload?.date ? String(payload.date).slice(0, 10) : todayISODate()
    const createdAt = new Date().toISOString()
    const item = {
      id: safeId(),
      content,
      createdAt,
      date,
      link,
    }
    setState((s) => ({ ...s, notes: [item, ...s.notes] }))
    return { ok: true }
  }, [])

  const deleteNote = useCallback((id) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }))
  }, [])

  const value = useMemo(
    () => ({
      events: state.events,
      reminders: state.reminders,
      notes: state.notes,
      addEvent,
      deleteEvent,
      addReminder,
      toggleReminder,
      deleteReminder,
      addNote,
      deleteNote,
      resetDashboardForMonth,
    }),
    [
      state,
      addEvent,
      deleteEvent,
      addReminder,
      toggleReminder,
      deleteReminder,
      addNote,
      deleteNote,
      resetDashboardForMonth,
    ]
  )

  return <DashboardTodayContext.Provider value={value}>{children}</DashboardTodayContext.Provider>
}

export function useDashboardToday() {
  const ctx = useContext(DashboardTodayContext)
  if (!ctx) throw new Error('useDashboardToday must be used within DashboardTodayProvider')
  return ctx
}

'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { localCacheKey, subscribeUserPayloadDoc, writeUserPayloadDoc } from '../lib/firestoreUserSync'
import { mergeOneTimeDemoToday } from '../lib/demoDashboardData'

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

export const TASK_PRIORITIES = ['low', 'normal', 'high']

const emptyAgenda = () => ({
  events: [],
  tasks: [],
  notes: [],
})

/**
 * Tasks used to be "reminders": title + time + date + done. They are now the
 * single to-do list, so `date` became `dueDate` (the deadline) and `time` stayed
 * as the optional moment to send the notification. Old payloads are read from
 * either shape, so a device still running the previous build loses nothing.
 */
function migrateTask(r, fallbackDate) {
  return {
    id: r.id,
    title: r.title || '',
    dueDate: r.dueDate || r.date || fallbackDate,
    time: r.time || '',
    priority: TASK_PRIORITIES.includes(r.priority) ? r.priority : 'normal',
    notes: r.notes || '',
    link: r.link || '',
    completed: !!r.completed,
    createdAt: r.createdAt || null,
  }
}

function migrateLoadedState(parsed) {
  const t = todayISODate()
  const events = Array.isArray(parsed.events)
    ? parsed.events.map((e) => ({ ...e, date: e.date || t }))
    : []
  const rawTasks = Array.isArray(parsed.tasks)
    ? parsed.tasks
    : Array.isArray(parsed.reminders)
      ? parsed.reminders
      : []
  const tasks = rawTasks.map((r) => migrateTask(r, t))
  const notes = Array.isArray(parsed.notes)
    ? parsed.notes.map((n) => ({
        ...n,
        date: n.date || (n.createdAt ? String(n.createdAt).slice(0, 10) : t),
      }))
    : []
  return { events, tasks, notes }
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
    tasks: payload.tasks,
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
            // Promote this device's local cache into the first cloud doc — the
            // only migration path for events/tasks/notes that have so far
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
          const next = normalizeRemotePayload(payload)
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
      tasks: s.tasks.filter((t) => !t.dueDate || String(t.dueDate).slice(0, 7) !== key),
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

  const updateEvent = useCallback((id, patch) => {
    const title = patch?.title !== undefined ? String(patch.title).trim() : undefined
    const time = patch?.time !== undefined ? String(patch.time).trim() : undefined
    if (title === '' || time === '') return { ok: false, error: 'Title and time are required.' }
    setState((s) => ({
      ...s,
      events: s.events.map((e) =>
        e.id === id
          ? {
              ...e,
              ...(title !== undefined ? { title } : null),
              ...(time !== undefined ? { time } : null),
              ...(patch?.link !== undefined ? { link: String(patch.link).trim() } : null),
              ...(patch?.date !== undefined ? { date: String(patch.date).slice(0, 10) } : null),
            }
          : e
      ),
    }))
    return { ok: true }
  }, [])

  const deleteEvent = useCallback((id) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }))
  }, [])

  // ── Tasks ────────────────────────────────────────────────────────────────

  const addTask = useCallback((payload) => {
    const title = String(payload?.title || '').trim()
    if (!title) return { ok: false, error: 'Title is required.' }
    const item = {
      id: safeId(),
      title,
      dueDate: payload?.dueDate ? String(payload.dueDate).slice(0, 10) : todayISODate(),
      // Optional: without a time the task is a deadline only, never a notification.
      time: String(payload?.time || '').trim(),
      priority: TASK_PRIORITIES.includes(payload?.priority) ? payload.priority : 'normal',
      notes: String(payload?.notes || '').trim(),
      link: String(payload?.link || '').trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setState((s) => ({ ...s, tasks: [item, ...s.tasks] }))
    // The created item comes back so callers can act on it — linking a brand
    // new task to a daily plan needs its id.
    return { ok: true, task: item }
  }, [])

  const updateTask = useCallback((id, patch) => {
    if (patch?.title !== undefined && !String(patch.title).trim()) {
      return { ok: false, error: 'Title is required.' }
    }
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t
        const next = { ...t }
        if (patch?.title !== undefined) next.title = String(patch.title).trim()
        if (patch?.dueDate !== undefined) next.dueDate = String(patch.dueDate).slice(0, 10)
        if (patch?.time !== undefined) next.time = String(patch.time).trim()
        if (patch?.notes !== undefined) next.notes = String(patch.notes).trim()
        if (patch?.link !== undefined) next.link = String(patch.link).trim()
        if (patch?.completed !== undefined) next.completed = !!patch.completed
        if (patch?.priority !== undefined && TASK_PRIORITIES.includes(patch.priority)) {
          next.priority = patch.priority
        }
        return next
      }),
    }))
    return { ok: true }
  }, [])

  const toggleTask = useCallback((id) => {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }))
  }, [])

  const deleteTask = useCallback((id) => {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
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

  /**
   * Sample agenda rows, on request only.
   *
   * These used to be injected automatically into any empty account, so a new
   * user's first job was deleting `(demo)` rows they never asked for. The
   * finance module always had this as an explicit button; now this matches.
   */
  const loadDemoAgenda = useCallback(() => {
    setState((prev) => mergeOneTimeDemoToday(prev))
    return { ok: true }
  }, [])

  const updateNote = useCallback((id, patch) => {
    if (patch?.content !== undefined && !String(patch.content).trim()) {
      return { ok: false, error: 'Note cannot be empty.' }
    }
    setState((s) => ({
      ...s,
      notes: s.notes.map((n) =>
        n.id === id
          ? {
              ...n,
              ...(patch?.content !== undefined ? { content: String(patch.content).trim() } : null),
              ...(patch?.link !== undefined ? { link: String(patch.link).trim() } : null),
              ...(patch?.date !== undefined ? { date: String(patch.date).slice(0, 10) } : null),
            }
          : n
      ),
    }))
    return { ok: true }
  }, [])

  const deleteNote = useCallback((id) => {
    setState((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) }))
  }, [])

  const value = useMemo(
    () => ({
      events: state.events,
      tasks: state.tasks,
      notes: state.notes,
      addEvent,
      updateEvent,
      deleteEvent,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      addNote,
      updateNote,
      deleteNote,
      loadDemoAgenda,
      resetDashboardForMonth,
    }),
    [
      state,
      addEvent,
      updateEvent,
      deleteEvent,
      addTask,
      updateTask,
      toggleTask,
      deleteTask,
      addNote,
      updateNote,
      deleteNote,
      loadDemoAgenda,
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

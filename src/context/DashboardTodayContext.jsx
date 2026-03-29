'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { subscribeUserPayloadDoc, writeUserPayloadDoc } from '../lib/firestoreUserSync'
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

function loadFromStorage() {
  if (typeof window === 'undefined') return emptyAgenda()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
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
  const { user } = useAuth()
  const [state, setState] = useState(() => loadFromStorage())
  const stateRef = useRef(state)
  const applyingRemoteRef = useRef(false)
  const seededCloudRef = useRef(false)
  const writeTimerRef = useRef(null)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore
    }
  }, [state])

  useEffect(() => {
    seededCloudRef.current = false
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return () => {}
    const unsub = subscribeUserPayloadDoc({
      userId: user.uid,
      pathSegments: FS_PATH,
      onRemote: ({ exists, payload }) => {
        if (!exists) {
          if (!seededCloudRef.current) {
            seededCloudRef.current = true
            writeUserPayloadDoc(user.uid, FS_PATH, stateRef.current).catch(() => {})
          }
          return
        }
        if (payload) {
          applyingRemoteRef.current = true
          let next = normalizeRemotePayload(payload)
          const demoKey = DEMO_TODAY_KEY(user?.uid)
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
          setState(next)
        }
      },
    })
    return unsub
  }, [user?.uid])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (user?.uid) return
    const demoKey = DEMO_TODAY_KEY(null)
    if (localStorage.getItem(demoKey)) return
    setState((prev) => {
      if (prev.events?.length || prev.reminders?.length || prev.notes?.length) return prev
      localStorage.setItem(demoKey, '1')
      return mergeOneTimeDemoToday(prev)
    })
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false
      return
    }
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    writeTimerRef.current = setTimeout(() => {
      writeUserPayloadDoc(user.uid, FS_PATH, stateRef.current).catch(() => {})
    }, 450)
    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current)
    }
  }, [state, user?.uid])

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

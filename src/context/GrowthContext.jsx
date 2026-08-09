'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './AuthContext'
import { localCacheKey, subscribeUserPayloadDoc, writeUserPayloadDoc } from '../lib/firestoreUserSync'
import { isOwner } from '../lib/owner'
import { buildDefaultSeed, buildOwnerSeed } from '../lib/growthSeed'
import { addDays, isoWeekKey, todayKey } from '../lib/growthMath'
import { getTrackerEntries, getUserTrackers } from '../lib/trackers'

const STORAGE_KEY = 'livio_growth_v1'
const FS_PATH = ['liver', 'growth']

/** Keep the payload doc small — Firestore caps a document at 1 MiB. */
const LOG_RETENTION_DAYS = 400

function safeId(prefix = 'g') {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return `${prefix}_${crypto.randomUUID()}`
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function emptyGrowth() {
  return {
    version: 1,
    seededWith: null,
    migratedTrackers: false,
    habits: [],
    habitLog: {},
    goals: [],
    routines: [],
    dailyPlan: {},
    dailyReview: {},
    triggerLog: [],
    weeklyReview: {},
    tracks: [],
    weakAreas: [],
    library: [],
    reference: [],
    planDefaults: { top3: ['', '', ''], focusBehavior: '', firstAction: '', energyWindow: '', sayNoTo: '' },
  }
}

function arr(v) {
  return Array.isArray(v) ? v : []
}
function obj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}

function pruneLog(log) {
  const cutoff = addDays(todayKey(), -LOG_RETENTION_DAYS)
  const out = {}
  Object.keys(log).forEach((k) => {
    if (k >= cutoff) out[k] = log[k]
  })
  return out
}

function normalize(raw) {
  const base = emptyGrowth()
  if (!raw || typeof raw !== 'object') return base
  return {
    ...base,
    ...raw,
    version: 1,
    habits: arr(raw.habits).map((h) => ({
      daysOfWeek: [],
      archived: false,
      target: 1,
      unit: '',
      remindAt: '',
      group: '',
      color: '#6366f1',
      emoji: '✅',
      order: 0,
      ...h,
    })),
    habitLog: pruneLog(obj(raw.habitLog)),
    goals: arr(raw.goals).map((g) => ({
      milestones: [],
      linkedHabitIds: [],
      current: 0,
      status: 'active',
      kind: 'milestone',
      ...g,
    })),
    routines: arr(raw.routines),
    dailyPlan: obj(raw.dailyPlan),
    dailyReview: obj(raw.dailyReview),
    triggerLog: arr(raw.triggerLog),
    weeklyReview: obj(raw.weeklyReview),
    tracks: arr(raw.tracks),
    weakAreas: arr(raw.weakAreas),
    library: arr(raw.library),
    reference: arr(raw.reference),
    planDefaults: { ...base.planDefaults, ...obj(raw.planDefaults) },
  }
}

function loadFromStorage(uid) {
  if (typeof window === 'undefined') return emptyGrowth()
  try {
    const raw = window.localStorage.getItem(localCacheKey(STORAGE_KEY, uid))
    if (!raw) return emptyGrowth()
    return normalize(JSON.parse(raw))
  } catch {
    return emptyGrowth()
  }
}

/**
 * Fold the legacy `trackers` / `tracker_entries` collections into the growth
 * payload. Habit and reading trackers become habits (their entries become log
 * ticks); goal trackers become numeric goals.
 */
async function migrateLegacyTrackers(uid, state) {
  let trackers = []
  try {
    trackers = (await getUserTrackers(uid)) || []
  } catch {
    return null
  }
  if (!trackers.length) return { ...state, migratedTrackers: true }

  const habits = [...state.habits]
  const goals = [...state.goals]
  const habitLog = { ...state.habitLog }
  const existingNames = new Set(habits.map((h) => h.name.toLowerCase()))

  for (const t of trackers) {
    const name = String(t.name || '').trim()
    if (!name || existingNames.has(name.toLowerCase())) continue

    if (t.type === 'goal') {
      goals.push({
        id: safeId('goal'),
        title: name,
        why: 'Imported from Trackers.',
        kind: 'numeric',
        target: Number(t.target || 0) || 100,
        current: 0,
        unit: t.unit || '',
        startDate: String(t.createdAt || todayKey()).slice(0, 10),
        dueDate: '',
        status: 'active',
        category: 'Imported',
        milestones: [],
        linkedHabitIds: [],
      })
      continue
    }

    const habitId = safeId('habit')
    habits.push({
      id: habitId,
      name,
      emoji: t.type === 'reading' ? '📖' : '✅',
      color: t.color || '#6366f1',
      group: 'Imported',
      cadence: 'daily',
      daysOfWeek: [],
      target: t.type === 'reading' ? Number(t.target || 1) || 1 : 1,
      unit: t.type === 'reading' ? 'pages' : '',
      remindAt: '',
      order: habits.length + 1,
      archived: false,
      createdAt: t.createdAt || new Date().toISOString(),
    })
    existingNames.add(name.toLowerCase())

    try {
      const entries = (await getTrackerEntries(t.id, uid)) || []
      for (const e of entries) {
        const key = String(e.date || '').slice(0, 10)
        if (!key) continue
        habitLog[key] = {
          ...(habitLog[key] || {}),
          [habitId]: { done: true, value: Number(e.value || 1), note: e.note || '' },
        }
      }
    } catch {
      // entries are a nice-to-have; the habit itself already migrated
    }
  }

  return { ...state, habits, goals, habitLog, migratedTrackers: true }
}

const GrowthContext = createContext(null)

export function GrowthProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const uid = user?.uid || null
  // Start empty so the server HTML matches the first client render; the local
  // cache is read after mount (below) to avoid React hydration error #418.
  const [state, setState] = useState(emptyGrowth)
  const stateRef = useRef(state)
  const applyingRemoteRef = useRef(false)
  const seededCloudRef = useRef(false)
  const remoteReadyRef = useRef(false)
  const writeTimerRef = useRef(null)
  const migrationRunRef = useRef(false)
  // Which account the in-memory state belongs to. Must be state, not a ref: a
  // ref flips synchronously inside the load effect, so the persist effect below
  // would fire on the SAME pass while `state` is still the empty initial value
  // and overwrite the cache with it. As state, both updates batch, so this only
  // changes once the loaded value is committed. `undefined` means "not hydrated
  // yet"; `null` is a real value (signed out).
  const [hydratedUid, setHydratedUid] = useState(undefined)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Load the cache belonging to the *current account*, once auth has resolved.
  // Re-runs on sign-in/sign-out so a second account on this browser never
  // inherits the first account's habits, goals or logs.
  useEffect(() => {
    if (authLoading) return
    seededCloudRef.current = false
    remoteReadyRef.current = false
    migrationRunRef.current = false
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
      // quota — the cloud copy is still authoritative
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
            const seed = isOwner(user) ? buildOwnerSeed() : buildDefaultSeed()
            // Seed ON TOP of current state, which promotes this device's local
            // cache into the first cloud doc — the only migration path for data
            // that has so far lived in IndexedDB alone. Safe because this effect
            // only attaches once `hydratedUid === uid`, so `stateRef.current` is
            // guaranteed to be THIS account's cache, never the previous user's.
            const next = normalize({ ...stateRef.current, ...seed })
            stateRef.current = next
            setState(next)
            writeUserPayloadDoc(uid, FS_PATH, next).catch(() => {})
          }
          return
        }
        remoteReadyRef.current = true
        if (!payload || typeof payload !== 'object') return
        // A local edit is queued (newer than this snapshot) — let it win rather
        // than reverting what the user just did.
        if (writeTimerRef.current) return

        let next = normalize(payload)
        // Cloud doc exists but was never seeded (e.g. created by an older build)
        if (!next.seededWith) {
          const seed = isOwner(user) ? buildOwnerSeed() : buildDefaultSeed()
          next = normalize({ ...next, ...seed })
        }
        if (JSON.stringify(next) === JSON.stringify(stateRef.current)) return
        applyingRemoteRef.current = true
        setState(next)
      },
    })
    return unsub
  }, [uid, user?.email, hydratedUid])

  // One-time fold-in of the legacy trackers collection
  useEffect(() => {
    if (!uid || hydratedUid !== uid || migrationRunRef.current) return
    if (!remoteReadyRef.current) return
    if (state.migratedTrackers) return
    migrationRunRef.current = true
    let cancelled = false
    migrateLegacyTrackers(uid, stateRef.current).then((next) => {
      if (!cancelled && next) setState(normalize(next))
    })
    return () => {
      cancelled = true
    }
  }, [uid, hydratedUid, state.migratedTrackers, state.seededWith])

  useEffect(() => {
    if (!uid || hydratedUid !== uid) return
    if (applyingRemoteRef.current) {
      applyingRemoteRef.current = false
      return
    }
    // Never write before Firestore has confirmed whether the doc exists —
    // otherwise an empty localStorage overwrites real cloud data on login.
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

  // Mobile suspends timers when the app backgrounds, so flush the debounce
  // immediately rather than losing the pending write.
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

  // ── Habits ───────────────────────────────────────────────────────────────

  const addHabit = useCallback((payload) => {
    const name = String(payload?.name || '').trim()
    if (!name) return { ok: false, error: 'Name is required.' }
    setState((s) => ({
      ...s,
      habits: [
        ...s.habits,
        {
          id: safeId('habit'),
          name,
          emoji: payload.emoji || '✅',
          color: payload.color || '#6366f1',
          group: payload.group || '',
          cadence: payload.cadence || 'daily',
          daysOfWeek: Array.isArray(payload.daysOfWeek) ? payload.daysOfWeek : [],
          target: Number(payload.target) > 0 ? Number(payload.target) : 1,
          unit: payload.unit || '',
          remindAt: payload.remindAt || '',
          order: s.habits.length + 1,
          archived: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }))
    return { ok: true }
  }, [])

  const updateHabit = useCallback((id, patch) => {
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
    }))
    return { ok: true }
  }, [])

  const deleteHabit = useCallback((id) => {
    setState((s) => {
      const habitLog = {}
      Object.entries(s.habitLog).forEach(([k, day]) => {
        const { [id]: _removed, ...rest } = day
        if (Object.keys(rest).length) habitLog[k] = rest
      })
      return { ...s, habits: s.habits.filter((h) => h.id !== id), habitLog }
    })
    return { ok: true }
  }, [])

  /** Tick / untick, or set a numeric value for counted habits. */
  const logHabit = useCallback((habitId, key, patch) => {
    const dateKey = key || todayKey()
    setState((s) => {
      const day = { ...(s.habitLog[dateKey] || {}) }
      const prev = day[habitId] || { done: false, value: 0, note: '' }
      const next = { ...prev, ...patch }
      if (!next.done && !next.value && !next.note) delete day[habitId]
      else day[habitId] = next
      const habitLog = { ...s.habitLog }
      if (Object.keys(day).length) habitLog[dateKey] = day
      else delete habitLog[dateKey]
      return { ...s, habitLog }
    })
    return { ok: true }
  }, [])

  const toggleHabit = useCallback((habit, key) => {
    const dateKey = key || todayKey()
    setState((s) => {
      const day = { ...(s.habitLog[dateKey] || {}) }
      const prev = day[habit.id]
      const target = Number(habit.target || 1)

      if (target > 1) {
        // Counted habit — each tap adds one, wrapping back to zero at target
        const value = Number(prev?.value || 0)
        const nextValue = value >= target ? 0 : value + 1
        if (nextValue === 0) delete day[habit.id]
        else day[habit.id] = { ...prev, value: nextValue, done: nextValue >= target }
      } else if (prev?.done) {
        delete day[habit.id]
      } else {
        day[habit.id] = { ...prev, done: true, value: 1 }
      }

      const habitLog = { ...s.habitLog }
      if (Object.keys(day).length) habitLog[dateKey] = day
      else delete habitLog[dateKey]
      return { ...s, habitLog }
    })
    return { ok: true }
  }, [])

  const reorderHabits = useCallback((orderedIds) => {
    setState((s) => ({
      ...s,
      habits: s.habits.map((h) => {
        const i = orderedIds.indexOf(h.id)
        return i >= 0 ? { ...h, order: i + 1 } : h
      }),
    }))
  }, [])

  // ── Goals ────────────────────────────────────────────────────────────────

  const upsertGoal = useCallback((payload) => {
    const title = String(payload?.title || '').trim()
    if (!title) return { ok: false, error: 'Title is required.' }
    const id = payload.id || safeId('goal')
    setState((s) => {
      const exists = s.goals.some((g) => g.id === id)
      const goal = {
        milestones: [],
        linkedHabitIds: [],
        current: 0,
        status: 'active',
        kind: 'milestone',
        category: '',
        ...payload,
        id,
        title,
      }
      return {
        ...s,
        goals: exists ? s.goals.map((g) => (g.id === id ? { ...g, ...goal } : g)) : [...s.goals, goal],
      }
    })
    return { ok: true, id }
  }, [])

  const deleteGoal = useCallback((id) => {
    setState((s) => ({
      ...s,
      // Detach children rather than silently deleting them
      goals: s.goals
        .filter((g) => g.id !== id)
        .map((g) => (g.parentGoalId === id ? { ...g, parentGoalId: null } : g)),
    }))
    return { ok: true }
  }, [])

  const toggleMilestone = useCallback((goalId, milestoneId) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id !== goalId
          ? g
          : {
              ...g,
              milestones: (g.milestones || []).map((m) =>
                m.id === milestoneId ? { ...m, done: !m.done } : m
              ),
            }
      ),
    }))
  }, [])

  const addMilestone = useCallback((goalId, title) => {
    const t = String(title || '').trim()
    if (!t) return { ok: false, error: 'Title is required.' }
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id !== goalId
          ? g
          : { ...g, milestones: [...(g.milestones || []), { id: safeId('ms'), title: t, due: '', done: false }] }
      ),
    }))
    return { ok: true }
  }, [])

  const deleteMilestone = useCallback((goalId, milestoneId) => {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id !== goalId ? g : { ...g, milestones: (g.milestones || []).filter((m) => m.id !== milestoneId) }
      ),
    }))
  }, [])

  // ── Daily plan & review ──────────────────────────────────────────────────

  const setDailyPlan = useCallback((key, patch) => {
    const dateKey = key || todayKey()
    setState((s) => ({
      ...s,
      dailyPlan: { ...s.dailyPlan, [dateKey]: { ...(s.dailyPlan[dateKey] || {}), ...patch } },
    }))
  }, [])

  const setDailyReview = useCallback((key, patch) => {
    const dateKey = key || todayKey()
    setState((s) => ({
      ...s,
      dailyReview: { ...s.dailyReview, [dateKey]: { ...(s.dailyReview[dateKey] || {}), ...patch } },
    }))
  }, [])

  const toggleRoutineBlock = useCallback((key, blockId) => {
    const dateKey = key || todayKey()
    setState((s) => {
      const plan = s.dailyPlan[dateKey] || {}
      const blocksDone = { ...(plan.blocksDone || {}) }
      if (blocksDone[blockId]) delete blocksDone[blockId]
      else blocksDone[blockId] = true
      return { ...s, dailyPlan: { ...s.dailyPlan, [dateKey]: { ...plan, blocksDone } } }
    })
  }, [])

  const setRoutineMode = useCallback((key, mode) => {
    const dateKey = key || todayKey()
    setState((s) => ({
      ...s,
      dailyPlan: { ...s.dailyPlan, [dateKey]: { ...(s.dailyPlan[dateKey] || {}), mode } },
    }))
  }, [])

  // ── Logs ─────────────────────────────────────────────────────────────────

  const addTriggerLog = useCallback((payload) => {
    const trigger = String(payload?.trigger || '').trim()
    if (!trigger) return { ok: false, error: 'What happened?' }
    setState((s) => ({
      ...s,
      triggerLog: [
        {
          id: safeId('trg'),
          date: payload.date || todayKey(),
          trigger,
          behavior: payload.behavior || '',
          fixUsed: payload.fixUsed || 'no',
          nextTime: String(payload.nextTime || '').trim(),
        },
        ...s.triggerLog,
      ],
    }))
    return { ok: true }
  }, [])

  const deleteTriggerLog = useCallback((id) => {
    setState((s) => ({ ...s, triggerLog: s.triggerLog.filter((t) => t.id !== id) }))
  }, [])

  const setWeeklyReview = useCallback((weekKey, patch) => {
    const key = weekKey || isoWeekKey()
    setState((s) => ({
      ...s,
      weeklyReview: { ...s.weeklyReview, [key]: { ...(s.weeklyReview[key] || {}), ...patch } },
    }))
  }, [])

  const updateTrack = useCallback((id, patch) => {
    setState((s) => ({ ...s, tracks: s.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
  }, [])

  const setWeakAreas = useCallback((list) => {
    setState((s) => ({ ...s, weakAreas: list }))
  }, [])

  const updateLibraryItem = useCallback((id, patch) => {
    setState((s) => ({ ...s, library: s.library.map((b) => (b.id === id ? { ...b, ...patch } : b)) }))
  }, [])

  const resetGrowth = useCallback(() => {
    setState((s) => ({ ...emptyGrowth(), seededWith: s.seededWith, migratedTrackers: true }))
  }, [])

  const value = useMemo(
    () => ({
      ...state,
      // Derived helpers used across pages
      activeHabits: state.habits.filter((h) => !h.archived).sort((a, b) => (a.order || 0) - (b.order || 0)),
      routine: state.routines[0] || null,
      // No `referenceBySlug` here any more: study pages moved to the shared
      // content library (useContent), so they can be updated for everyone at
      // once. `state.reference` is still normalized for old payloads, but
      // nothing reads it.
      addHabit,
      updateHabit,
      deleteHabit,
      logHabit,
      toggleHabit,
      reorderHabits,
      upsertGoal,
      deleteGoal,
      toggleMilestone,
      addMilestone,
      deleteMilestone,
      setDailyPlan,
      setDailyReview,
      toggleRoutineBlock,
      setRoutineMode,
      addTriggerLog,
      deleteTriggerLog,
      setWeeklyReview,
      updateTrack,
      setWeakAreas,
      updateLibraryItem,
      resetGrowth,
    }),
    [
      state,
      addHabit,
      updateHabit,
      deleteHabit,
      logHabit,
      toggleHabit,
      reorderHabits,
      upsertGoal,
      deleteGoal,
      toggleMilestone,
      addMilestone,
      deleteMilestone,
      setDailyPlan,
      setDailyReview,
      toggleRoutineBlock,
      setRoutineMode,
      addTriggerLog,
      deleteTriggerLog,
      setWeeklyReview,
      updateTrack,
      setWeakAreas,
      updateLibraryItem,
      resetGrowth,
    ]
  )

  return <GrowthContext.Provider value={value}>{children}</GrowthContext.Provider>
}

export function useGrowth() {
  const ctx = useContext(GrowthContext)
  if (!ctx) throw new Error('useGrowth must be used within a GrowthProvider')
  return ctx
}

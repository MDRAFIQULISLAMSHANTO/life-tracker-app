/**
 * Local reminder scheduling.
 *
 * Notifications are shown through the service worker so they survive the tab
 * being backgrounded. This is *local* scheduling — a timer in the page — so it
 * fires while Livio is open or backgrounded-but-alive. A fully terminated app
 * (iOS reclaiming memory, force-quit) will not fire until push is added; the
 * settings copy says so rather than quietly over-promising.
 */

import { todayKey } from './growthMath'
import { localCacheKey } from './firestoreUserSync'

const PREFS_KEY_BASE = 'livio_reminder_prefs_v1'

/**
 * Notification preferences are per-person, so they are namespaced by account
 * like every other local cache — otherwise a second account on the same browser
 * inherits the first account's quiet hours and reminder toggles.
 */
export function prefsKeyFor(uid) {
  return localCacheKey(PREFS_KEY_BASE, uid)
}

export const DEFAULT_PREFS = {
  enabled: true,
  leadMinutes: 0,
  habitReminders: true,
  quietFrom: '',
  quietTo: '',
}

export function loadPrefs(uid) {
  if (typeof window === 'undefined') return DEFAULT_PREFS
  try {
    const raw = localStorage.getItem(prefsKeyFor(uid))
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs, uid) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(prefsKeyFor(uid), JSON.stringify({ ...DEFAULT_PREFS, ...prefs }))
  } catch {
    // quota — prefs fall back to defaults next load
  }
}

function seenKeyFor(dateKey) {
  return `livio_notif_seen_${dateKey}`
}

function loadSeen(dateKey) {
  try {
    const raw = localStorage.getItem(seenKeyFor(dateKey))
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function markSeen(dateKey, id) {
  try {
    const set = loadSeen(dateKey)
    set.add(id)
    localStorage.setItem(seenKeyFor(dateKey), JSON.stringify([...set]))
    // Yesterday's list is dead weight in localStorage
    Object.keys(localStorage)
      .filter((k) => k.startsWith('livio_notif_seen_') && k !== seenKeyFor(dateKey))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // non-fatal: worst case a reminder repeats
  }
}

export async function showNotification({ title, body, tag, url }) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready
      const target = reg.active || navigator.serviceWorker.controller
      if (target) {
        target.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag, url })
        return
      }
      // No controller yet (first load after install) — the registration can
      // still show it directly.
      await reg.showNotification(title, { body, tag, data: { url } })
      return
    } catch {
      // fall through to the page-level API
    }
  }
  try {
    new Notification(title, { body, tag })
  } catch {
    // Some browsers only allow SW notifications; nothing more to try
  }
}

function timeToMinutes(hhmm) {
  const [h, m] = String(hhmm || '').split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

function inQuietHours(date, prefs) {
  const from = timeToMinutes(prefs.quietFrom)
  const to = timeToMinutes(prefs.quietTo)
  if (from == null || to == null) return false
  const now = date.getHours() * 60 + date.getMinutes()
  // A window like 22:00 → 07:00 wraps past midnight
  return from <= to ? now >= from && now < to : now >= from || now < to
}

/** How long we still fire a reminder after its time passed (app was closed). */
const GRACE_MS = 10 * 60 * 1000
/** Timers beyond this are re-armed on the next foreground instead. */
const MAX_TIMER_MS = 6 * 60 * 60 * 1000

/**
 * @param {Array<{id,title,body?,time,date,url?}>} items
 * @param {object} prefs
 * @returns {() => void} clear-all-timers cleanup
 */
export function scheduleReminders(items, prefs = DEFAULT_PREFS) {
  if (typeof window === 'undefined') return () => {}
  if (!prefs.enabled) return () => {}
  if (!('Notification' in window) || Notification.permission !== 'granted') return () => {}

  const now = new Date()
  const dateKey = todayKey()
  const seen = loadSeen(dateKey)
  const timers = []

  items.forEach((item) => {
    if (!item?.time || item.date !== dateKey) return
    const dedupeId = `${item.kind || 'rem'}:${item.id}:${item.time}`
    if (seen.has(dedupeId)) return

    const minutes = timeToMinutes(item.time)
    if (minutes == null) return

    const fireAt = new Date(now)
    fireAt.setHours(0, minutes - Number(prefs.leadMinutes || 0), 0, 0)
    const delay = fireAt.getTime() - now.getTime()

    const fire = () => {
      if (inQuietHours(new Date(), prefs)) return
      markSeen(dateKey, dedupeId)
      showNotification({
        title: item.title,
        body: item.body || '',
        tag: dedupeId,
        url: item.url || '/dashboard',
      })
    }

    if (delay <= 0) {
      // Missed while the app was closed — still worth surfacing, but only briefly
      if (delay > -GRACE_MS) fire()
      else markSeen(dateKey, dedupeId)
      return
    }
    if (delay > MAX_TIMER_MS) return

    timers.push(setTimeout(fire, delay))
  })

  return () => timers.forEach(clearTimeout)
}

/** Map task deadlines + habit reminder times into scheduler items. */
export function buildReminderItems({ tasks = [], habits = [], habitLog = {}, prefs = DEFAULT_PREFS }) {
  const dateKey = todayKey()
  const items = []

  tasks.forEach((t) => {
    // Field names must match DashboardTodayContext: `completed`, `title`, `dueDate`.
    if (t.completed) return
    if (t.dueDate !== dateKey) return
    // A task without a time is a deadline only — no notification to schedule.
    if (!t.time) return
    items.push({
      kind: 'reminder',
      id: t.id,
      title: 'Livio task',
      body: t.title,
      time: t.time,
      date: t.dueDate,
      url: '/dashboard/tasks',
    })
  })

  if (prefs.habitReminders) {
    habits.forEach((h) => {
      if (!h.remindAt || h.archived) return
      if (habitLog?.[dateKey]?.[h.id]?.done) return
      items.push({
        kind: 'habit',
        id: h.id,
        title: `${h.emoji || '✅'} ${h.name}`,
        body: 'Time to tick this off.',
        time: h.remindAt,
        date: dateKey,
        url: '/dashboard/growth',
      })
    })
  }

  return items
}

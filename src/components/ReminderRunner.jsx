'use client'

import { useEffect, useState } from 'react'
import { useDashboardToday } from '../context/DashboardTodayContext'
import { useGrowth } from '../context/GrowthContext'
import { useAuth } from '../context/AuthContext'
import {
  buildReminderItems,
  DEFAULT_PREFS,
  loadPrefs,
  prefsKeyFor,
  scheduleReminders,
} from '../lib/reminderScheduler'

/**
 * Arms local notification timers for today's reminders and habit reminder
 * times. Mounted once inside the dashboard layout.
 *
 * Timers are re-armed whenever the app returns to the foreground — mobile
 * suspends JS timers while backgrounded, so a timer set an hour ago may never
 * have fired.
 */
export default function ReminderRunner() {
  const { reminders } = useDashboardToday()
  const { habits, habitLog } = useGrowth()
  const { user } = useAuth()
  const uid = user?.uid || null
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [tick, setTick] = useState(0)

  // Pick up preference changes made in Settings (same tab and other tabs), and
  // re-read from scratch whenever the signed-in account changes.
  useEffect(() => {
    const reload = () => setPrefs(loadPrefs(uid))
    reload()
    const onStorage = (e) => {
      if (!e.key || e.key === prefsKeyFor(uid)) reload()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('livio:reminder-prefs', reload)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('livio:reminder-prefs', reload)
    }
  }, [uid])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setTick((t) => t + 1)
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    // Re-arm periodically so reminders further than MAX_TIMER_MS out get picked up
    const interval = setInterval(() => setTick((t) => t + 1), 30 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const items = buildReminderItems({ reminders, habits, habitLog, prefs })
    return scheduleReminders(items, prefs)
  }, [reminders, habits, habitLog, prefs, tick])

  return null
}

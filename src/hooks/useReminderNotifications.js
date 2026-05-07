'use client'

import { useEffect } from 'react'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

async function sendNotificationViaSW(title, body, tag) {
  if (!('serviceWorker' in navigator)) return
  try {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag, url: '/dashboard' })
  } catch {}
}

export function useReminderNotifications(reminders = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const today = todayISO()
    const seenKey = `livio_notif_seen_${today}`
    const seenRaw = localStorage.getItem(seenKey)
    const seen = seenRaw ? JSON.parse(seenRaw) : []

    const pending = reminders.filter(
      (r) => !r.done && r.date === today && !seen.includes(r.id)
    )
    if (!pending.length) return

    const newSeen = [...seen, ...pending.map((r) => r.id)]
    localStorage.setItem(seenKey, JSON.stringify(newSeen))

    pending.forEach((r) => {
      sendNotificationViaSW('Livio Reminder', r.text, `reminder-${r.id}`)
    })
  }, [reminders])
}

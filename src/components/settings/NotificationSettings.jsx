'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, CheckCircle2, AlertTriangle } from 'lucide-react'

async function sendTestNotification() {
  if (!('serviceWorker' in navigator)) {
    new Notification('Livio', { body: 'Notifications are working!' })
    return
  }
  try {
    const reg = await navigator.serviceWorker.ready
    reg.active?.postMessage({
      type: 'SHOW_NOTIFICATION',
      title: 'Livio',
      body: "Notifications are working! You'll get reminders for today's tasks.",
      tag: 'livio-test',
      url: '/dashboard',
    })
  } catch {}
}

export default function NotificationSettings() {
  const [permission, setPermission] = useState('default')
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    if (!('Notification' in window)) { setSupported(false); return }
    setPermission(Notification.permission)
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') await sendTestNotification()
  }

  if (!supported) {
    return (
      <div
        className="flex items-start gap-3 p-4 rounded-2xl"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Notifications not supported in this browser. Install as app for best experience.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {permission === 'granted' ? (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: '#16a34a' }} />
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Notifications enabled</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
              You'll get alerts for today's pending reminders when you open the app.
            </p>
          </div>
          <button
            type="button"
            onClick={sendTestNotification}
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-70"
            style={{ background: 'rgba(22,163,74,0.12)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.2)' }}
          >
            Test
          </button>
        </div>
      ) : permission === 'denied' ? (
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.15)' }}
        >
          <BellOff className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Notifications blocked</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Blocked in browser settings. To fix: tap the lock icon in your address bar → Site settings → Notifications → Allow.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
            Get notified about today's pending reminders each time you open the app. Works best when installed as a PWA.
          </p>
          <button
            type="button"
            onClick={requestPermission}
            className="accent-btn flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
          >
            <Bell className="w-4 h-4" />
            Enable notifications
          </button>
        </div>
      )}
    </div>
  )
}

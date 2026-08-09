'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Bell, BellOff, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { DEFAULT_PREFS, loadPrefs, savePrefs, showNotification } from '../../lib/reminderScheduler'
import { Button, Field, Input, Select } from '../ui'

const LEAD_OPTIONS = [
  { value: 0, label: 'At the reminder time' },
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
]

function sendTestNotification() {
  return showNotification({
    title: 'Livio',
    body: 'Notifications are working — you’ll get your reminders here.',
    tag: 'livio-test',
    url: '/dashboard',
  })
}

export default function NotificationSettings() {
  const { user } = useAuth()
  const uid = user?.uid || null
  const [permission, setPermission] = useState('default')
  const [supported, setSupported] = useState(true)
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [isIOS, setIsIOS] = useState(false)
  const [standalone, setStandalone] = useState(true)

  useEffect(() => {
    if (!('Notification' in window)) {
      setSupported(false)
    } else {
      setPermission(Notification.permission)
    }
    setPrefs(loadPrefs(uid))
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    setStandalone(
      !!window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches
    )
  }, [uid])

  const update = (patch) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    savePrefs(next, uid)
    // Tell the running scheduler to re-read without waiting for a reload
    window.dispatchEvent(new Event('livio:reminder-prefs'))
  }

  const requestPermission = async () => {
    if (!('Notification' in window)) return
    const result = await Notification.requestPermission()
    setPermission(result)
    if (result === 'granted') await sendTestNotification()
  }

  // iOS only exposes the Notification API once the PWA is on the Home Screen
  if (!supported) {
    return (
      <div
        className="flex items-start gap-3 rounded-2xl p-4"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#d97706' }} />
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
            Notifications aren’t available here
          </p>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
            {isIOS && !standalone
              ? 'On iPhone, notifications only work once Livio is added to the Home Screen. Tap Share → Add to Home Screen, then open Livio from the new icon.'
              : 'This browser doesn’t support web notifications. Install Livio as an app for the full experience.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {permission === 'granted' ? (
        <div
          className="flex flex-wrap items-center gap-3 rounded-2xl p-4"
          style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: '#16a34a' }} />
          <div className="min-w-[12rem] flex-1">
            <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
              Notifications enabled
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
              Reminders fire at their set time while Livio is open or running in the background.
              A force-quit app can’t wake itself yet.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={sendTestNotification}>
            Send test
          </Button>
        </div>
      ) : permission === 'denied' ? (
        <div
          className="flex items-start gap-3 rounded-2xl p-4"
          style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.15)' }}
        >
          <BellOff className="mt-0.5 h-5 w-5 shrink-0" style={{ color: 'var(--danger)' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
              Notifications blocked
            </p>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Blocked in browser settings. Tap the lock icon in the address bar → Site settings →
              Notifications → Allow. On iPhone: Settings → Notifications → Livio.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-sm" style={{ color: 'var(--text-2)' }}>
            Get reminded about today’s tasks and habits at the times you set.
            {isIOS && !standalone && ' On iPhone, add Livio to your Home Screen first.'}
          </p>
          <Button onClick={requestPermission}>
            <Bell className="h-4 w-4" />
            Enable notifications
          </Button>
        </div>
      )}

      {permission === 'granted' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="When to notify">
            <Select value={prefs.leadMinutes} onChange={(e) => update({ leadMinutes: Number(e.target.value) })}>
              {LEAD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Habit reminders">
            <Select
              value={prefs.habitReminders ? 'on' : 'off'}
              onChange={(e) => update({ habitReminders: e.target.value === 'on' })}
            >
              <option value="on">On — remind me per habit</option>
              <option value="off">Off — task reminders only</option>
            </Select>
          </Field>

          <Field label="Quiet from" hint="Leave blank for none">
            <Input type="time" value={prefs.quietFrom} onChange={(e) => update({ quietFrom: e.target.value })} />
          </Field>

          <Field label="Quiet until">
            <Input type="time" value={prefs.quietTo} onChange={(e) => update({ quietTo: e.target.value })} />
          </Field>
        </div>
      )}
    </div>
  )
}

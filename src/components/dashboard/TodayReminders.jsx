'use client'

import { useMemo, useState } from 'react'
import { Bell, ExternalLink, Plus, Trash2, X, Check } from 'lucide-react'
import { useDashboardToday } from '../../context/DashboardTodayContext'
import { useFinance } from '../../context/FinanceContext'

function isValidHttpUrl(str) {
  if (!str) return false
  try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:' }
  catch { return false }
}

export default function TodayReminders() {
  const { ledgerMonthKey } = useFinance()
  const { reminders, addReminder, toggleReminder, deleteReminder } = useDashboardToday()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  const visible = useMemo(
    () => reminders.filter((r) => (r.date ? String(r.date).slice(0, 7) : '') === ledgerMonthKey),
    [reminders, ledgerMonthKey]
  )

  const submit = (e) => {
    e.preventDefault()
    const res = addReminder({ title, time, link, date })
    if (!res.ok) { setError(res.error || 'Failed'); return }
    setTitle(''); setTime(''); setLink('')
    setDate(new Date().toISOString().slice(0, 10))
    setOpen(false)
  }

  const openModal = () => {
    setError('')
    const t = new Date().toISOString().slice(0, 10)
    setDate(t.slice(0, 7) === ledgerMonthKey ? t : `${ledgerMonthKey}-01`)
    setOpen(true)
  }

  return (
    <>
      <div className="dashboard-glass-card flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" style={{ color: '#f59e0b' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Reminders</h3>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        {visible.length > 0 ? (
          <div className="space-y-2 flex-1">
            {visible.map((r) => (
              <div key={r.id} className="item-row flex items-start gap-2.5 group">
                <button
                  type="button"
                  onClick={() => toggleReminder(r.id)}
                  className="flex items-center justify-center w-4 h-4 rounded mt-0.5 shrink-0 transition-all"
                  style={{
                    border: r.completed ? 'none' : '1.5px solid var(--input-border)',
                    background: r.completed ? '#22c55e' : 'transparent',
                  }}
                >
                  {r.completed && <Check className="w-2.5 h-2.5 text-white" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)', textDecoration: r.completed ? 'line-through' : 'none', opacity: r.completed ? 0.5 : 1 }}>{r.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{r.date} · {r.time}</p>
                  {r.link && isValidHttpUrl(r.link) && (
                    <a href={r.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] mt-0.5 font-medium hover:underline"
                      style={{ color: 'var(--accent)' }}>
                      <ExternalLink className="w-2.5 h-2.5" /> Link
                    </a>
                  )}
                </div>
                <button type="button" onClick={() => deleteReminder(r.id)}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#ef4444' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 flex-1" style={{ color: 'var(--text-3)' }}>
            <Bell className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No reminders this month</p>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} aria-label="Close" onClick={() => setOpen(false)} />
          <div className="glass-modal relative w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>New Reminder</h4>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-xl" style={{ color: 'var(--text-2)' }}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              {[
                { label: 'Title', value: title, setter: setTitle, type: 'text', placeholder: 'Pay rent', required: true },
                { label: 'Date', value: date, setter: setDate, type: 'date', required: true },
                { label: 'Time', value: time, setter: setTime, type: 'text', placeholder: '5:00 PM', required: true },
                { label: 'Link (optional)', value: link, setter: setLink, type: 'url', placeholder: 'https://...', required: false },
              ].map(({ label, value, setter, type, placeholder, required }) => (
                <div key={label}>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>{label}</label>
                  <input type={type} value={value} onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder} required={required} className="glass-input" />
                </div>
              ))}
              {error && <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{ border: '1px solid var(--input-border)', color: 'var(--text-1)' }}>Cancel</button>
                <button type="submit" className="accent-btn flex-1 py-2.5">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

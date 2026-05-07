'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ExternalLink, Plus, Trash2, X } from 'lucide-react'
import { useDashboardToday } from '../../context/DashboardTodayContext'
import { useFinance } from '../../context/FinanceContext'

function isValidHttpUrl(str) {
  if (!str) return false
  try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:' }
  catch { return false }
}

const inputStyle = {
  background: 'var(--input-bg)',
  border: '1px solid var(--input-border)',
  color: 'var(--text-1)',
  borderRadius: '0.875rem',
  padding: '0.625rem 1rem',
  fontSize: '0.875rem',
  fontWeight: 500,
  width: '100%',
  outline: 'none',
  fontFamily: 'inherit',
}

export default function TodayEvents() {
  const { ledgerMonthKey } = useFinance()
  const { events, addEvent, deleteEvent } = useDashboardToday()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  const visible = useMemo(
    () => events.filter((e) => (e.date ? String(e.date).slice(0, 7) : '') === ledgerMonthKey),
    [events, ledgerMonthKey]
  )

  const submit = (e) => {
    e.preventDefault()
    const res = addEvent({ title, time, link, date })
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
            <CalendarDays className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Events</h3>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all"
            style={{ background: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)' }}
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>

        {visible.length > 0 ? (
          <div className="space-y-2 flex-1">
            {visible.map((ev) => (
              <div key={ev.id} className="item-row flex items-start gap-2.5 group">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--accent)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{ev.title}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-3)' }}>{ev.date} · {ev.time}</p>
                  {ev.link && isValidHttpUrl(ev.link) && (
                    <a href={ev.link} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] mt-0.5 font-medium hover:underline"
                      style={{ color: 'var(--accent)' }}>
                      <ExternalLink className="w-2.5 h-2.5" /> Link
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteEvent(ev.id)}
                  className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#ef4444' }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 flex-1" style={{ color: 'var(--text-3)' }}>
            <CalendarDays className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">No events this month</p>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} aria-label="Close" onClick={() => setOpen(false)} />
          <div className="glass-modal relative w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>New Event</h4>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-xl" style={{ color: 'var(--text-2)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              {[
                { label: 'Title', value: title, setter: setTitle, type: 'text', placeholder: 'Team meeting', required: true },
                { label: 'Date', value: date, setter: setDate, type: 'date', required: true },
                { label: 'Time', value: time, setter: setTime, type: 'text', placeholder: '10:00 AM', required: true },
                { label: 'Link (optional)', value: link, setter: setLink, type: 'url', placeholder: 'https://...', required: false },
              ].map(({ label, value, setter, type, placeholder, required }) => (
                <div key={label}>
                  <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>{label}</label>
                  <input
                    type={type}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    required={required}
                    className="glass-input"
                  />
                </div>
              ))}
              {error && <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors" style={{ border: '1px solid var(--input-border)', color: 'var(--text-1)' }}>Cancel</button>
                <button type="submit" className="accent-btn flex-1 py-2.5">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

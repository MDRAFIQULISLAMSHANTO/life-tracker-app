'use client'

import { useMemo, useState } from 'react'
import { Calendar, ExternalLink, Plus, Trash2, X } from 'lucide-react'
import { useDashboardToday } from '../../context/DashboardTodayContext'
import { useFinance } from '../../context/FinanceContext'

function isValidHttpUrl(str) {
  if (!str) return false
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
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

  const visibleEvents = useMemo(
    () => events.filter((e) => (e.date ? String(e.date).slice(0, 7) : '') === ledgerMonthKey),
    [events, ledgerMonthKey]
  )

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const res = addEvent({ title, time, link, date })
    if (!res.ok) {
      setError(res.error || 'Failed to add')
      return
    }
    setTitle('')
    setTime('')
    setLink('')
    setDate(new Date().toISOString().slice(0, 10))
    setOpen(false)
  }

  return (
    <>
      <div className="dashboard-glass-card flex h-full flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-text-primary">Today&apos;s Events</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(true)
              setError('')
              const t = new Date().toISOString().slice(0, 10)
              setDate(t.slice(0, 7) === ledgerMonthKey ? t : `${ledgerMonthKey}-01`)
            }}
            className="text-sm text-primary font-medium hover:text-primary-600 transition-colors"
          >
            Add
          </button>
        </div>
        {visibleEvents.length > 0 ? (
          <div className="space-y-3 flex-1">
            {visibleEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
              >
                <div className="flex-shrink-0 w-2 h-2 mt-1.5 bg-primary rounded-full" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{event.title}</p>
                      <p className="text-xs text-text-secondary">
                        {event.date} · {event.time}
                      </p>
                      {event.link && isValidHttpUrl(event.link) && (
                        <a
                          href={event.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Link
                        </a>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteEvent(event.id)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      aria-label="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-text-secondary flex-1">
            <Calendar className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">No events for this month</p>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                New event
              </h4>
              <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="Team meeting"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Time</label>
                <input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="10:00 AM"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Link (optional)</label>
                <input
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  type="url"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  placeholder="https://..."
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl border border-gray-300 font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-white font-medium hover:bg-primary-600">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

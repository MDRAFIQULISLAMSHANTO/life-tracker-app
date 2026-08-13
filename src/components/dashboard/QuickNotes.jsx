'use client'

import { useMemo, useState } from 'react'
import { ExternalLink, StickyNote, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useDashboardToday } from '../../context/DashboardTodayContext'
import { formatRelativeTime } from '../../utils/formatters'

const VISIBLE_LIMIT = 5

function isValidHttpUrl(str) {
  if (!str) return false
  try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:' }
  catch { return false }
}

export default function QuickNotes() {
  const { notes, addNote, updateNote, deleteNote } = useDashboardToday()
  const [open, setOpen] = useState(false)
  // null = writing a new note; an id = editing that one
  const [editingId, setEditingId] = useState(null)
  const [content, setContent] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  // Not filtered by the ledger month — that is a money control, and hiding
  // notes when you review a different month's spending made no sense. Most
  // recent first instead.
  const visible = useMemo(
    () =>
      [...notes]
        .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
        .slice(0, VISIBLE_LIMIT),
    [notes]
  )

  const submit = (e) => {
    e.preventDefault()
    const res = editingId
      ? updateNote(editingId, { content, link, date })
      : addNote({ content, link, date })
    if (!res.ok) { setError(res.error || 'Failed'); return }
    setContent(''); setLink('')
    setDate(new Date().toISOString().slice(0, 10))
    setEditingId(null)
    setOpen(false)
  }

  const openModal = () => {
    setError('')
    setEditingId(null)
    setContent(''); setLink('')
    setDate(new Date().toISOString().slice(0, 10))
    setOpen(true)
  }

  const openEdit = (note) => {
    setError('')
    setEditingId(note.id)
    setContent(note.content || '')
    setLink(note.link || '')
    setDate(note.date || new Date().toISOString().slice(0, 10))
    setOpen(true)
  }

  return (
    <>
      <div className="dashboard-glass-card flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>Notes</h3>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="flex items-center justify-center w-6 h-6 rounded-lg transition-all"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {visible.length > 0 ? (
          <div className="space-y-2 flex-1">
            {visible.map((note) => (
              <div key={note.id} className="item-row group relative">
                <p className="text-xs font-medium whitespace-pre-wrap break-words pr-6" style={{ color: 'var(--text-1)' }}>{note.content}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-3)' }}>
                  {note.date}{note.createdAt ? ` · ${formatRelativeTime(note.createdAt)}` : ''}
                </p>
                {note.link && isValidHttpUrl(note.link) && (
                  <a href={note.link} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] mt-0.5 font-medium hover:underline"
                    style={{ color: 'var(--accent)' }}>
                    <ExternalLink className="w-2.5 h-2.5" /> Link
                  </a>
                )}
                <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button type="button" onClick={() => openEdit(note)} aria-label="Edit note"
                    className="p-1 rounded" style={{ color: 'var(--text-2)' }}>
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => deleteNote(note.id)} aria-label="Delete note"
                    className="p-1 rounded" style={{ color: '#ef4444' }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 flex-1" style={{ color: 'var(--text-3)' }}>
            <StickyNote className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs mb-1">No notes yet</p>
            <button type="button" onClick={openModal} className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
              Add first note →
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} aria-label="Close" onClick={() => setOpen(false)} />
          <div className="glass-modal relative w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>{editingId ? 'Edit Note' : 'New Note'}</h4>
              <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-xl" style={{ color: 'var(--text-2)' }}><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>Note</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="glass-input resize-y"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-1)', borderRadius: '0.875rem', padding: '0.625rem 1rem', fontSize: '0.875rem', width: '100%', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                  placeholder="Write something…"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="glass-input" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: 'var(--text-2)' }}>Link (optional)</label>
                <input type="url" value={link} onChange={(e) => setLink(e.target.value)} className="glass-input" placeholder="https://..." />
              </div>
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

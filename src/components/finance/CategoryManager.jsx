'use client'

import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'

export default function CategoryManager({ title, categories = [], onAdd, onRemove }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const normalized = useMemo(
    () => new Set(categories.map((c) => String(c).trim().toLowerCase())),
    [categories]
  )

  const handleAdd = () => {
    setError('')
    const trimmed = String(name || '').trim()
    if (!trimmed) { setError('Name required.'); return }
    if (normalized.has(trimmed.toLowerCase())) { setError('Already exists.'); return }
    const result = onAdd?.(trimmed)
    if (!result?.ok) { setError(result?.error || 'Unable to add.'); return }
    setName('')
  }

  const handleKey = (e) => { if (e.key === 'Enter') handleAdd() }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
    >
      <h3 className="text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
        {title}
      </h3>

      {/* Input row */}
      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Add new category…"
          className="glass-input flex-1 min-h-[44px]"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="accent-btn shrink-0 px-4 min-h-[44px] text-sm font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {error && (
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--danger, #ef4444)' }}>{error}</p>
      )}

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div
              key={cat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(var(--accent-rgb),0.1)',
                border: '1px solid rgba(var(--accent-rgb),0.2)',
                color: 'var(--text-1)',
              }}
            >
              <span>{cat}</span>
              <button
                type="button"
                onClick={() => {
                  const result = onRemove?.(cat)
                  if (!result?.ok) setError(result?.error || 'Unable to remove.')
                  else setError('')
                }}
                aria-label={`Remove ${cat}`}
                className="flex items-center justify-center w-4 h-4 rounded-full transition-opacity hover:opacity-70"
                style={{ color: 'var(--danger, #ef4444)' }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>No categories yet.</p>
      )}
    </div>
  )
}

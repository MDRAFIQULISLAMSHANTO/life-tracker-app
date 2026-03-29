'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

export default function CategoryManager({
  title,
  categories = [],
  onAdd,
  onRemove,
}) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const normalized = useMemo(
    () => new Set(categories.map((c) => String(c).trim().toLowerCase())),
    [categories]
  )

  const handleAdd = () => {
    setError('')
    const trimmed = String(name || '').trim()
    if (!trimmed) {
      setError('Category name is required.')
      return
    }
    if (normalized.has(trimmed.toLowerCase())) {
      setError('This category already exists.')
      return
    }
    const result = onAdd?.(trimmed)
    if (!result?.ok) {
      setError(result?.error || 'Unable to add category.')
      return
    }
    setName('')
  }

  return (
    <div className="bg-background-card rounded-2xl p-6 shadow-soft">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add new category..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
          type="button"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {error && <div className="text-sm text-danger mb-4">{error}</div>}

      {categories.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-full">
              <span className="text-sm font-medium text-text-primary">{cat}</span>
              <button
                type="button"
                onClick={() => {
                  const result = onRemove?.(cat)
                  if (!result?.ok) setError(result?.error || 'Unable to remove category.')
                  else setError('')
                }}
                className="p-1.5 rounded-lg text-danger hover:bg-red-50 transition-colors"
                aria-label={`Remove ${cat}`}
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-text-secondary">No categories yet.</div>
      )}
    </div>
  )
}

'use client'

import { useState, useMemo, useEffect } from 'react'
import { X, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { TRANSACTION_TYPES } from '../../utils/constants'
import { useFinance } from '../../context/FinanceContext'

function QuickAddModal({ isOpen, onClose }) {
  const [selectedType, setSelectedType] = useState(TRANSACTION_TYPES.EXPENSE)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [catOpen, setCatOpen] = useState(false)

  const { expenseCategories, incomeCategories, addTransaction } = useFinance()

  const categories = useMemo(
    () => (selectedType === TRANSACTION_TYPES.INCOME ? incomeCategories : expenseCategories),
    [selectedType, incomeCategories, expenseCategories]
  )
  const activeCats = categories?.length ? categories : ['Other']

  useEffect(() => {
    if (!category && activeCats[0]) setCategory(activeCats[0])
  }, [selectedType]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTypeChange = (type) => {
    setSelectedType(type)
    const next = type === TRANSACTION_TYPES.INCOME ? (incomeCategories[0] || '') : (expenseCategories[0] || '')
    setCategory(next)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = addTransaction({ type: selectedType, amount, category, description, date })
    if (!result.ok) { console.warn(result.error); return }
    setAmount(''); setCategory(''); setDescription('')
    setDate(new Date().toISOString().slice(0, 10))
    onClose()
  }

  if (!isOpen) return null

  const isIncome = selectedType === TRANSACTION_TYPES.INCOME
  const typeColor = isIncome ? '#22c55e' : '#ef4444'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', position: 'absolute', inset: 0 }}
      />
      <div
        className="scroll-touch relative w-full sm:max-w-md overflow-y-auto"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--card-border)',
          borderRadius: '1.5rem 1.5rem 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.2)',
          maxHeight: '90dvh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--card-border)' }} />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Quick Add</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl transition-opacity hover:opacity-70" style={{ color: 'var(--text-2)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: TRANSACTION_TYPES.INCOME, label: 'Income', Icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
              { id: TRANSACTION_TYPES.EXPENSE, label: 'Expense', Icon: TrendingDown, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            ].map(({ id, label, Icon, color, bg }) => {
              const active = selectedType === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTypeChange(id)}
                  className="flex flex-col items-center gap-2 py-3.5 rounded-2xl transition-all"
                  style={{
                    background: active ? bg : 'var(--input-bg)',
                    border: `2px solid ${active ? color : 'var(--input-border)'}`,
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: active ? color : 'var(--text-2)' }} />
                  <span className="text-sm font-bold" style={{ color: active ? color : 'var(--text-2)' }}>{label}</span>
                </button>
              )
            })}
          </div>

          {/* Amount - big input */}
          <div>
            <label className="block text-xs font-bold mb-2" style={{ color: 'var(--text-2)' }}>Amount</label>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: 'var(--input-bg)', border: `2px solid ${typeColor}33` }}>
              <span className="text-2xl font-black" style={{ color: typeColor }}>
                {isIncome ? '+' : '−'}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                required
                className="flex-1 bg-transparent text-2xl font-black tabular-nums outline-none"
                style={{ color: 'var(--text-1)' }}
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="glass-input" />
          </div>

          {/* Category dropdown */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Category</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setCatOpen(!catOpen)}
                className="glass-input flex items-center justify-between text-left"
                style={{ color: 'var(--text-1)' }}
              >
                <span>{category || 'Select…'}</span>
                <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ transform: catOpen ? 'rotate(180deg)' : 'none', color: 'var(--text-3)' }} />
              </button>
              {catOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setCatOpen(false)} />
                  <div
                    className="absolute z-20 w-full mt-1.5 rounded-2xl overflow-hidden"
                    style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', maxHeight: 220, overflowY: 'auto' }}
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setCategory(cat); setCatOpen(false) }}
                        className="w-full px-4 py-2.5 text-left text-sm font-medium transition-colors"
                        style={{
                          color: category === cat ? 'var(--accent)' : 'var(--text-1)',
                          background: category === cat ? 'rgba(var(--accent-rgb),0.08)' : 'transparent',
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Note (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note…"
              rows={2}
              className="glass-input resize-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-1)', borderRadius: '0.875rem', padding: '0.625rem 1rem', fontSize: '0.875rem', width: '100%', outline: 'none', fontFamily: 'inherit', resize: 'none' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 pb-safe">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl text-sm font-bold transition-opacity hover:opacity-70"
              style={{ border: '1px solid var(--input-border)', color: 'var(--text-1)' }}>
              Cancel
            </button>
            <button type="submit"
              className="accent-btn flex-1 py-3 rounded-2xl text-sm"
              style={{ borderRadius: '1rem' }}>
              Add Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuickAddModal

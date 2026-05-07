'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Edit3, Plus, Save, Trash2, Wallet } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency } from '../../../utils/formatters'

const labelCls = 'block text-xs font-bold mb-1.5 uppercase tracking-wide'
const labelStyle = { color: 'var(--text-3)' }

export default function LoansPage() {
  const { user, loading } = useAuth()
  const { currency, ledgerMonthKey, loans, upsertLoan, deleteLoan } = useFinance()

  const [editingId, setEditingId] = useState(null)
  const [amount, setAmount] = useState('')
  const [borrowDate, setBorrowDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [extendedDate, setExtendedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState('')
  const [addToIncome, setAddToIncome] = useState(true)
  const [error, setError] = useState('')

  const visible = useMemo(() =>
    [...loans]
      .filter((l) => l.borrowDate && String(l.borrowDate).slice(0, 7) === ledgerMonthKey)
      .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)),
    [loans, ledgerMonthKey]
  )

  const totals = useMemo(() => ({
    totalBorrowed: visible.reduce((s, l) => s + Number(l.amount || 0), 0),
    incomeCounted: visible.filter((l) => l.addToIncome).reduce((s, l) => s + Number(l.amount || 0), 0),
  }), [visible])

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-2)' }}>Loading…</div>
  if (!user) return null

  const resetForm = () => {
    setEditingId(null); setAmount(''); setReason(''); setAddToIncome(true); setError('')
    setBorrowDate(new Date().toISOString().slice(0, 10))
    setExtendedDate(new Date().toISOString().slice(0, 10))
  }

  const startEdit = (l) => {
    setEditingId(l.id); setAmount(String(l.amount ?? '')); setReason(l.reason || '')
    setBorrowDate(l.borrowDate || new Date().toISOString().slice(0, 10))
    setExtendedDate(l.extendedDate || new Date().toISOString().slice(0, 10))
    setAddToIncome(!!l.addToIncome); setError('')
  }

  const onSubmit = (e) => {
    e.preventDefault(); setError('')
    const result = upsertLoan({ id: editingId || undefined, amount, borrowDate, extendedDate, reason, addToIncome })
    if (!result.ok) { setError(result.error || 'Unable to save.'); return }
    resetForm()
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>Loans</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Borrowed money for <span className="font-bold" style={{ color: 'var(--accent)' }}>{ledgerMonthKey}</span>
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Total borrowed', value: totals.totalBorrowed },
            { label: 'Counted as income', value: totals.incomeCounted },
          ].map(({ label, value }) => (
            <div key={label} className="glass-card !p-4 text-right" style={{ minWidth: 130 }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>{label}</p>
              <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(value, currency)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="glass-card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
              <Wallet className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-base font-extrabold" style={{ color: 'var(--text-1)' }}>
              {editingId ? 'Edit Loan' : 'New Loan'}
            </h2>
          </div>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs font-bold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70" style={{ color: 'var(--text-2)', border: '1px solid var(--card-border)' }}>
              Cancel
            </button>
          )}
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              min="0" step="0.01" required placeholder="0.00" className="glass-input min-h-[44px]" />
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setAddToIncome((v) => !v)}
                className="relative w-10 h-6 rounded-full transition-colors cursor-pointer shrink-0"
                style={{ background: addToIncome ? 'var(--accent)' : 'var(--input-border)' }}
              >
                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: addToIncome ? 'translateX(16px)' : 'translateX(0)' }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                Add to finance income when loan is taken
              </span>
            </label>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Borrow date</label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <input type="date" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)}
                className="glass-input pl-9 min-h-[44px]" />
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Extended / due date</label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <input type="date" value={extendedDate} onChange={(e) => setExtendedDate(e.target.value)}
                className="glass-input pl-9 min-h-[44px]" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Why did you borrow? (emergency, business, investment…)"
              className="glass-input resize-none" />
          </div>

          {error && <p className="md:col-span-2 text-sm font-semibold" style={{ color: 'var(--danger)' }}>{error}</p>}

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={resetForm}
              className="px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-opacity hover:opacity-70"
              style={{ border: '1px solid var(--card-border)', color: 'var(--text-2)' }}>
              Clear
            </button>
            <button type="submit" className="accent-btn px-5 py-2.5 text-sm min-h-[44px] flex items-center gap-2">
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Save Loan' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="glass-card">
        <h2 className="text-base font-extrabold mb-4" style={{ color: 'var(--text-1)' }}>
          Loans in {ledgerMonthKey}
        </h2>

        {visible.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No loans for this month.</p>
        ) : (
          <div className="space-y-3">
            {visible.map((l) => (
              <div key={l.id} className="item-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-base font-extrabold tabular-nums" style={{ color: 'var(--text-1)' }}>
                      {formatCurrency(Number(l.amount || 0), currency)}
                    </span>
                    <span className="badge-income text-[10px]">{l.addToIncome ? 'Income' : 'Loan only'}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                    Borrowed: <strong style={{ color: 'var(--text-2)' }}>{l.borrowDate}</strong>
                    {' · '}Due: <strong style={{ color: 'var(--text-2)' }}>{l.extendedDate}</strong>
                  </p>
                  {l.reason && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{l.reason}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => startEdit(l)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold min-h-[36px] transition-opacity hover:opacity-70"
                    style={{ border: '1px solid var(--card-border)', color: 'var(--text-1)' }}>
                    <Edit3 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button type="button" onClick={() => deleteLoan(l.id)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold min-h-[36px] transition-opacity hover:opacity-70"
                    style={{ background: 'rgba(var(--danger-rgb,220,38,38),0.1)', color: 'var(--danger)', border: '1px solid rgba(var(--danger-rgb,220,38,38),0.2)' }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

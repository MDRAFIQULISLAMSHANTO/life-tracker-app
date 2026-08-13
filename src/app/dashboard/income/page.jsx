'use client'

import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import CategoryManager from '../../../components/finance/CategoryManager'
import TransactionEditSheet from '../../../components/finance/TransactionEditSheet'
import { formatCurrency } from '../../../utils/formatters'

const labelCls = 'block text-xs font-bold mb-1.5 uppercase tracking-wide'
const labelStyle = { color: 'var(--text-3)' }

export default function IncomePage() {
  const { user, loading } = useAuth()
  const { currency, ledgerMonthKey, incomeCategories, accounts, transactions, addCategory, removeCategory, addTransaction, deleteTransaction } = useFinance()

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(incomeCategories[0] || 'Other')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [submitError, setSubmitError] = useState('')
  // The row being corrected; null when the sheet is closed.
  const [editing, setEditing] = useState(null)

  const incomeTx = useMemo(() =>
    transactions
      .filter((t) => t.type === 'income' && t.date && String(t.date).slice(0, 7) === ledgerMonthKey)
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, ledgerMonthKey]
  )

  const total = useMemo(() => incomeTx.reduce((s, t) => s + Number(t.amount || 0), 0), [incomeTx])

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-2)' }}>Loading…</div>
  if (!user) return null

  const handleSubmit = (e) => {
    e.preventDefault(); setSubmitError('')
    const result = addTransaction({ type: 'income', amount, category, description, date, accountId })
    if (!result.ok) { setSubmitError(result.error || 'Failed to add.'); return }
    setAmount(''); setDescription(''); setCategory(incomeCategories[0] || 'Other')
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>Income</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Month: <span className="font-bold" style={{ color: 'var(--accent)' }}>{ledgerMonthKey}</span>
          </p>
        </div>
        <div className="glass-card !p-4 text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Total Income</p>
          <p className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--success)' }}>{formatCurrency(total, currency)}</p>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(22,163,74,0.1)' }}>
            <Plus className="w-4 h-4" style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="text-base font-extrabold" style={{ color: 'var(--text-1)' }}>Add Income</h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              step="0.01" min="0" placeholder="0.00" required className="glass-input min-h-[44px]" />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="glass-input min-h-[44px]">
              {(incomeCategories.length ? incomeCategories : ['Other']).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="glass-input min-h-[44px]" />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className="glass-input min-h-[44px]">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Note (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note…" rows={2} className="glass-input resize-none" />
          </div>

          {submitError && <p className="md:col-span-2 text-sm font-semibold" style={{ color: 'var(--danger)' }}>{submitError}</p>}

          <div className="md:col-span-2 flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => { setAmount(''); setDescription(''); setSubmitError('') }}
              className="px-4 py-2.5 rounded-xl text-sm font-bold min-h-[44px] transition-opacity hover:opacity-70"
              style={{ border: '1px solid var(--card-border)', color: 'var(--text-2)' }}>
              Clear
            </button>
            <button type="submit" className="accent-btn px-5 py-2.5 text-sm min-h-[44px]" style={{ background: 'var(--success)', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' }}>
              Add Income
            </button>
          </div>
        </form>
      </div>

      <CategoryManager title="Income categories" categories={incomeCategories}
        onAdd={(n) => addCategory('income', n)} onRemove={(n) => removeCategory('income', n)} />

      {/* Table */}
      <div className="glass-card overflow-hidden" style={{ padding: 0 }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="text-base font-extrabold" style={{ color: 'var(--text-1)' }}>All Income — {ledgerMonthKey}</h2>
        </div>
        {incomeTx.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-3)' }}>No income yet.</p>
        ) : (
          <div className="scroll-touch overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  {['Date', 'Category', 'Note', 'Amount', ''].map((h) => (
                    <th key={h} className={`py-3 px-4 font-bold text-xs uppercase tracking-wide text-left ${h === '' ? 'text-right' : ''}`}
                      style={{ color: 'var(--text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {incomeTx.map((t) => (
                  <tr key={t.id} className="transition-colors" style={{ borderBottom: '1px solid var(--card-border)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td className="py-3 px-4 whitespace-nowrap text-xs" style={{ color: 'var(--text-3)' }}>{t.date}</td>
                    <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-1)' }}>{t.category}</td>
                    <td className="py-3 px-4 max-w-[220px] truncate" style={{ color: 'var(--text-2)' }}>{t.description || '—'}</td>
                    <td className="py-3 px-4 font-bold tabular-nums whitespace-nowrap" style={{ color: 'var(--success)' }}>
                      +{formatCurrency(Number(t.amount || 0), currency)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="ml-auto flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => setEditing(t)} aria-label="Edit entry"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                          style={{ background: 'var(--input-bg)', color: 'var(--text-2)' }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => deleteTransaction(t.id)} aria-label="Delete entry"
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-opacity hover:opacity-70"
                          style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger)' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionEditSheet open={!!editing} tx={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

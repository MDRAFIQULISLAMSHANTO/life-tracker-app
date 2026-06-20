'use client'

import { useMemo, useState } from 'react'
import {
  ArrowDownLeft, ArrowUpRight, CalendarDays, Edit3, Plus, Save, Trash2, User, Wallet, X,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance, loanOutstanding, loanPaid } from '../../../context/FinanceContext'
import { formatCurrency } from '../../../utils/formatters'

const labelCls = 'block text-xs font-bold mb-1.5 uppercase tracking-wide'
const labelStyle = { color: 'var(--text-3)' }

const today = () => new Date().toISOString().slice(0, 10)

// Per-direction copy so the single form/list reads correctly in both modes.
const COPY = {
  borrowed: {
    badge: 'Borrowed',
    personLabel: 'Lender (person)',
    personPlaceholder: 'Who lent you the money?',
    dateLabel: 'Borrow date',
    countLabel: 'Count as income when received',
    reasonPlaceholder: 'Why did you borrow? (emergency, business, investment…)',
    Icon: ArrowDownLeft,
    color: 'var(--danger)',
    rgb: 'var(--danger-rgb,220,38,38)',
  },
  lent: {
    badge: 'Lent',
    personLabel: 'Borrower (person)',
    personPlaceholder: 'Who did you lend the money to?',
    dateLabel: 'Lent date',
    countLabel: 'Count as expense when given',
    reasonPlaceholder: 'Why did you lend? (help, business…)',
    Icon: ArrowUpRight,
    color: 'var(--accent)',
    rgb: 'var(--accent-rgb)',
  },
}

export default function LoansPage() {
  const { user, loading } = useAuth()
  const { currency, ledgerMonthKey, loans, upsertLoan, deleteLoan, addRepayment, deleteRepayment } = useFinance()

  const [editingId, setEditingId] = useState(null)
  const [direction, setDirection] = useState('borrowed')
  const [amount, setAmount] = useState('')
  const [borrowDate, setBorrowDate] = useState(today)
  const [extendedDate, setExtendedDate] = useState(today)
  const [reason, setReason] = useState('')
  const [person, setPerson] = useState('')
  const [countInFinance, setCountInFinance] = useState(true)
  const [error, setError] = useState('')

  // Repayment inline form state (one open at a time)
  const [repayFor, setRepayFor] = useState(null)
  const [repayAmount, setRepayAmount] = useState('')
  const [repayDate, setRepayDate] = useState(today)
  const [repayNote, setRepayNote] = useState('')
  const [repayError, setRepayError] = useState('')

  // Loans whose borrow/lent date falls in the displayed month
  const visible = useMemo(() =>
    [...loans]
      .filter((l) => l.borrowDate && String(l.borrowDate).slice(0, 7) === ledgerMonthKey)
      .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)),
    [loans, ledgerMonthKey]
  )

  // All-time outstanding split by direction
  const summary = useMemo(() => {
    let owe = 0
    let owed = 0
    loans.forEach((l) => {
      const out = loanOutstanding(l)
      if (l.direction === 'lent') owed += out
      else owe += out
    })
    return { owe, owed }
  }, [loans])

  // All-time per-person outstanding, split into what you owe vs what's owed to you
  const personSummary = useMemo(() => {
    const map = {}
    loans.forEach((l) => {
      const name = (l.person || '').trim()
      if (!name) return
      const out = loanOutstanding(l)
      if (out <= 0) return
      if (!map[name]) map[name] = { owe: 0, owed: 0 }
      if (l.direction === 'lent') map[name].owed += out
      else map[name].owe += out
    })
    return Object.entries(map).sort((a, b) => (b[1].owe + b[1].owed) - (a[1].owe + a[1].owed))
  }, [loans])

  const uniquePersons = useMemo(() => {
    const names = new Set(loans.map((l) => (l.person || '').trim()).filter(Boolean))
    return [...names]
  }, [loans])

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-2)' }}>Loading…</div>
  if (!user) return null

  const resetForm = () => {
    setEditingId(null); setDirection('borrowed'); setAmount(''); setReason(''); setPerson('')
    setCountInFinance(true); setError('')
    setBorrowDate(today()); setExtendedDate(today())
  }

  const startEdit = (l) => {
    setEditingId(l.id); setDirection(l.direction === 'lent' ? 'lent' : 'borrowed')
    setAmount(String(l.amount ?? '')); setReason(l.reason || ''); setPerson(l.person || '')
    setBorrowDate(l.borrowDate || today()); setExtendedDate(l.extendedDate || today())
    setCountInFinance(!!l.countInFinance); setError('')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const onSubmit = (e) => {
    e.preventDefault(); setError('')
    const result = upsertLoan({ id: editingId || undefined, direction, amount, borrowDate, extendedDate, reason, countInFinance, person })
    if (!result.ok) { setError(result.error || 'Unable to save.'); return }
    resetForm()
  }

  const openRepay = (loanId) => {
    setRepayFor(loanId); setRepayAmount(''); setRepayNote(''); setRepayDate(today()); setRepayError('')
  }

  const onAddRepayment = (loanId) => {
    setRepayError('')
    const result = addRepayment(loanId, { amount: repayAmount, date: repayDate, note: repayNote })
    if (!result.ok) { setRepayError(result.error || 'Unable to add repayment.'); return }
    setRepayFor(null); setRepayAmount(''); setRepayNote('')
  }

  const c = COPY[direction]

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>Loans</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
            Money borrowed &amp; lent for <span className="font-bold" style={{ color: 'var(--accent)' }}>{ledgerMonthKey}</span>
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="glass-card !p-4 text-right" style={{ minWidth: 140 }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>You owe</p>
            <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--danger)' }}>{formatCurrency(summary.owe, currency)}</p>
          </div>
          <div className="glass-card !p-4 text-right" style={{ minWidth: 140 }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-3)' }}>Owed to you</p>
            <p className="text-lg font-extrabold tabular-nums" style={{ color: 'var(--accent)' }}>{formatCurrency(summary.owed, currency)}</p>
          </div>
        </div>
      </div>

      {/* Per-person summary */}
      {personSummary.length > 0 && (
        <div className="glass-card">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-3)' }}>
            People — Outstanding
          </p>
          <div className="scroll-touch flex gap-3 overflow-x-auto pb-1">
            {personSummary.map(([name, v]) => (
              <div key={name} className="flex-shrink-0"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', borderRadius: 14, padding: '10px 16px', minWidth: 120 }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <User className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                  <span className="text-xs font-bold truncate max-w-[100px]" style={{ color: 'var(--text-1)' }}>{name}</span>
                </div>
                {v.owe > 0 && (
                  <p className="text-xs font-extrabold tabular-nums" style={{ color: 'var(--danger)' }}>
                    You owe {formatCurrency(v.owe, currency)}
                  </p>
                )}
                {v.owed > 0 && (
                  <p className="text-xs font-extrabold tabular-nums" style={{ color: 'var(--accent)' }}>
                    Owes you {formatCurrency(v.owed, currency)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

        {/* Direction segmented toggle */}
        <div className="grid grid-cols-2 gap-2 mb-5 p-1 rounded-xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
          {['borrowed', 'lent'].map((dir) => {
            const active = direction === dir
            const dc = COPY[dir]
            const DIcon = dc.Icon
            return (
              <button key={dir} type="button" onClick={() => setDirection(dir)}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all min-h-[44px]"
                style={{
                  background: active ? `rgba(${dc.rgb},0.14)` : 'transparent',
                  color: active ? dc.color : 'var(--text-3)',
                  boxShadow: active ? `inset 0 0 0 1.5px ${dc.color}` : 'none',
                }}>
                <DIcon className="w-4 h-4" />
                {dir === 'borrowed' ? 'Borrowed (taken)' : 'Lent (given)'}
              </button>
            )
          })}
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls} style={labelStyle}>Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
              min="0" step="0.01" required placeholder="0.00" className="glass-input min-h-[44px]" inputMode="decimal" />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>{c.personLabel}</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <input type="text" value={person} onChange={(e) => setPerson(e.target.value)}
                list="loan-persons-list" placeholder={c.personPlaceholder} className="glass-input pl-9 min-h-[44px]" autoComplete="off" />
              <datalist id="loan-persons-list">
                {uniquePersons.map((p) => <option key={p} value={p} />)}
              </datalist>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div onClick={() => setCountInFinance((v) => !v)}
                className="relative w-10 h-6 rounded-full transition-colors cursor-pointer shrink-0"
                style={{ background: countInFinance ? 'var(--accent)' : 'var(--input-border)' }}>
                <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: countInFinance ? 'translateX(16px)' : 'translateX(0)' }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{c.countLabel}</span>
            </label>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>{c.dateLabel}</label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <input type="date" value={borrowDate} onChange={(e) => setBorrowDate(e.target.value)} className="glass-input pl-9 min-h-[44px]" />
            </div>
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Extended / due date</label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              <input type="date" value={extendedDate} onChange={(e) => setExtendedDate(e.target.value)} className="glass-input pl-9 min-h-[44px]" />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder={c.reasonPlaceholder} className="glass-input resize-none" />
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

      {/* Loan List */}
      <div className="glass-card">
        <h2 className="text-base font-extrabold mb-4" style={{ color: 'var(--text-1)' }}>
          Loans in {ledgerMonthKey}
        </h2>

        {visible.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>No loans for this month.</p>
        ) : (
          <div className="space-y-3">
            {visible.map((l) => {
              const lc = COPY[l.direction === 'lent' ? 'lent' : 'borrowed']
              const LIcon = lc.Icon
              const paid = loanPaid(l)
              const outstanding = loanOutstanding(l)
              const settled = outstanding <= 0
              const pct = l.amount > 0 ? Math.min(100, Math.round((paid / l.amount) * 100)) : 0
              return (
                <div key={l.id} className="item-row flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-base font-extrabold tabular-nums" style={{ color: 'var(--text-1)' }}>
                          {formatCurrency(Number(l.amount || 0), currency)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `rgba(${lc.rgb},0.12)`, color: lc.color }}>
                          <LIcon className="w-2.5 h-2.5" />
                          {lc.badge}
                        </span>
                        {l.person && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(var(--accent-rgb),0.10)', color: 'var(--accent)' }}>
                            <User className="w-2.5 h-2.5" />
                            {l.person}
                          </span>
                        )}
                        {!l.countInFinance && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--input-bg)', color: 'var(--text-3)', border: '1px solid var(--card-border)' }}>
                            Tracking only
                          </span>
                        )}
                        {settled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)' }}>
                            Settled
                          </span>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                        {lc.badge}: <strong style={{ color: 'var(--text-2)' }}>{l.borrowDate}</strong>
                        {' · '}Due: <strong style={{ color: 'var(--text-2)' }}>{l.extendedDate}</strong>
                      </p>
                      {l.reason && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{l.reason}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {!settled && (
                        <button type="button" onClick={() => openRepay(l.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold min-h-[36px] transition-opacity hover:opacity-70"
                          style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}>
                          <Plus className="w-3.5 h-3.5" /> Repay
                        </button>
                      )}
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

                  {/* Repayment progress */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold mb-1" style={{ color: 'var(--text-3)' }}>
                      <span>Repaid {formatCurrency(paid, currency)} of {formatCurrency(Number(l.amount || 0), currency)}</span>
                      <span style={{ color: settled ? 'var(--accent)' : 'var(--text-2)' }}>
                        Outstanding {formatCurrency(outstanding, currency)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--input-bg)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                    </div>
                  </div>

                  {/* Existing repayments */}
                  {(l.repayments || []).length > 0 && (
                    <div className="space-y-1.5">
                      {l.repayments.map((r) => (
                        <div key={r.id} className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg"
                          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
                          <span className="flex items-center gap-2 min-w-0">
                            <span className="font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(Number(r.amount || 0), currency)}</span>
                            <span style={{ color: 'var(--text-3)' }}>{r.date}</span>
                            {r.note && <span className="truncate" style={{ color: 'var(--text-3)' }}>· {r.note}</span>}
                          </span>
                          <button type="button" onClick={() => deleteRepayment(l.id, r.id)}
                            className="shrink-0 p-1 rounded-md transition-opacity hover:opacity-70" style={{ color: 'var(--danger)' }} aria-label="Delete repayment">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline add-repayment form */}
                  {repayFor === l.id && (
                    <div className="rounded-xl p-3" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)}
                          min="0" step="0.01" placeholder="Amount" className="glass-input min-h-[40px]" inputMode="decimal" autoFocus />
                        <input type="date" value={repayDate} onChange={(e) => setRepayDate(e.target.value)} className="glass-input min-h-[40px]" />
                        <input type="text" value={repayNote} onChange={(e) => setRepayNote(e.target.value)} placeholder="Note (optional)" className="glass-input min-h-[40px]" />
                      </div>
                      {repayError && <p className="text-xs font-semibold mt-2" style={{ color: 'var(--danger)' }}>{repayError}</p>}
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <button type="button" onClick={() => setRepayFor(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-opacity hover:opacity-70"
                          style={{ border: '1px solid var(--card-border)', color: 'var(--text-2)' }}>
                          Cancel
                        </button>
                        <button type="button" onClick={() => onAddRepayment(l.id)}
                          className="accent-btn px-4 py-1.5 text-xs flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5" /> Add repayment
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

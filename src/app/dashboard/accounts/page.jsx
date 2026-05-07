'use client'

import { useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Plus, X, CreditCard, Building2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency } from '../../../utils/formatters'

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
]

function computeBalances({ accounts, transactions }) {
  const b = {}
  accounts.forEach((a) => { b[a.id] = Number(a.startingBalance || 0) })
  transactions.forEach((t) => {
    if (!t.accountId || b[t.accountId] === undefined) return
    const amt = Number(t.amount || 0)
    if (t.type === 'expense') b[t.accountId] -= amt
    else b[t.accountId] += amt
  })
  return b
}

export default function AccountsPage() {
  const { user, loading } = useAuth()
  const { currency, accounts, transactions, addTransaction } = useFinance()

  const balances = useMemo(() => computeBalances({ accounts, transactions }), [accounts, transactions])
  const total = useMemo(() => Object.values(balances).reduce((s, v) => s + Number(v || 0), 0), [balances])

  const [active, setActive] = useState(() => accounts[0]?.id || '')
  const [transferOpen, setTransferOpen] = useState(false)
  const [fromId, setFromId] = useState(() => accounts[0]?.id || '')
  const [toId, setToId] = useState(() => accounts[1]?.id || accounts[0]?.id || '')
  const [transferAmt, setTransferAmt] = useState('')
  const [transferNote, setTransferNote] = useState('')
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [transferMsg, setTransferMsg] = useState('')

  const activeTx = useMemo(() =>
    transactions.filter((t) => t.accountId === active).sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, active]
  )

  const activeAccount = accounts.find((a) => a.id === active)

  const handleTransfer = (e) => {
    e.preventDefault()
    if (fromId === toId) { setTransferMsg('Cannot transfer to same account.'); return }
    const amt = parseFloat(transferAmt)
    if (!amt || amt <= 0) { setTransferMsg('Invalid amount.'); return }

    const note = transferNote || `Transfer to ${accounts.find(a => a.id === toId)?.name || 'account'}`
    addTransaction({ type: 'expense', amount: amt, category: 'Transfer', description: note, date: transferDate, accountId: fromId })
    addTransaction({ type: 'income',  amount: amt, category: 'Transfer', description: `Transfer from ${accounts.find(a => a.id === fromId)?.name || 'account'}`, date: transferDate, accountId: toId })

    setTransferAmt(''); setTransferNote(''); setTransferMsg('')
    setTransferOpen(false)
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-2)' }}>Loading…</div>
  if (!user) return null

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

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>Accounts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>Manage balances and transfer between accounts</p>
        </div>
        <div className="flex items-center gap-3">
          {accounts.length >= 2 && (
            <button
              onClick={() => { setFromId(accounts[0]?.id || ''); setToId(accounts[1]?.id || ''); setTransferOpen(true) }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all"
              style={{ background: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}
            >
              <ArrowLeftRight className="w-4 h-4" />
              Transfer
            </button>
          )}
          <div className="glass-card !p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-3)' }}>Total</p>
            <p className="text-xl font-extrabold tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(total, currency)}</p>
          </div>
        </div>
      </div>

      {/* Bank cards scroll row */}
      {accounts.length > 0 ? (
        <div className="scroll-touch flex gap-4 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollSnapType: 'x mandatory' }}>
          {accounts.map((a, idx) => {
            const bal = Number(balances[a.id] || 0)
            const isActive = a.id === active
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setActive(a.id)}
                className="bank-card flex-shrink-0 text-left"
                style={{
                  width: 260,
                  background: CARD_GRADIENTS[idx % CARD_GRADIENTS.length],
                  boxShadow: isActive
                    ? `0 16px 48px rgba(0,0,0,0.25), 0 0 0 3px rgba(255,255,255,0.3)`
                    : '0 8px 24px rgba(0,0,0,0.15)',
                  scrollSnapAlign: 'start',
                  opacity: isActive ? 1 : 0.75,
                  transform: isActive ? 'translateY(-4px) scale(1.01)' : 'none',
                  transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                {/* Card chip decoration */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-white/80" />
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Livio</span>
                  </div>
                  <Building2 className="w-5 h-5 text-white/60" />
                </div>
                <p className="text-2xl font-extrabold text-white tabular-nums mb-1">
                  {formatCurrency(bal, currency)}
                </p>
                <p className="text-sm font-semibold text-white/80">{a.name}</p>
                {isActive && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Active</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="glass-card flex flex-col items-center py-10" style={{ color: 'var(--text-3)' }}>
          <CreditCard className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No accounts yet — add one in Settings</p>
        </div>
      )}

      {/* Transaction list for active account */}
      <div className="glass-card">
        <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-1)' }}>
          {activeAccount?.name || 'Account'} — Transactions
        </h2>

        {activeTx.length === 0 ? (
          <div className="flex flex-col items-center py-10" style={{ color: 'var(--text-3)' }}>
            <ArrowLeftRight className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">No transactions for this account</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTx.map((t) => {
              const isExp = t.type === 'expense'
              const isTransfer = t.category === 'Transfer'
              const iconBg = isTransfer
                ? 'rgba(var(--accent-rgb),0.12)'
                : isExp ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)'
              const iconColor = isTransfer ? 'var(--accent)' : isExp ? '#ef4444' : '#22c55e'
              const Icon = isTransfer ? ArrowLeftRight : isExp ? ArrowDownCircle : ArrowUpCircle

              return (
                <div key={t.id} className="item-row flex items-center gap-3">
                  <div className="icon-circle" style={{ background: iconBg }}>
                    <Icon className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                        {t.description || t.category}
                      </p>
                      {isTransfer
                        ? <span className="badge-transfer">Transfer</span>
                        : isExp
                          ? <span className="badge-expense">Expense</span>
                          : <span className="badge-income">Income</span>
                      }
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{t.date}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums shrink-0" style={{ color: isExp ? '#ef4444' : '#22c55e' }}>
                    {isExp ? '−' : '+'}{formatCurrency(Number(t.amount || 0), currency)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {transferOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }} onClick={() => setTransferOpen(false)} />
          <div className="glass-modal relative w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="icon-circle" style={{ background: 'rgba(var(--accent-rgb),0.12)' }}>
                  <ArrowLeftRight className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Internal Transfer</h3>
              </div>
              <button type="button" onClick={() => setTransferOpen(false)} className="p-1.5 rounded-xl" style={{ color: 'var(--text-2)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>From</label>
                  <select value={fromId} onChange={(e) => setFromId(e.target.value)} required style={inputStyle}>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>To</label>
                  <select value={toId} onChange={(e) => setToId(e.target.value)} required style={inputStyle}>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Amount</label>
                <input
                  type="number"
                  value={transferAmt}
                  onChange={(e) => setTransferAmt(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Date</label>
                <input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} required style={inputStyle} />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-2)' }}>Note (optional)</label>
                <input type="text" value={transferNote} onChange={(e) => setTransferNote(e.target.value)} placeholder="e.g. Moving savings" style={inputStyle} />
              </div>

              {transferMsg && <p className="text-xs font-medium" style={{ color: '#ef4444' }}>{transferMsg}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setTransferOpen(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold"
                  style={{ border: '1px solid var(--input-border)', color: 'var(--text-1)' }}>
                  Cancel
                </button>
                <button type="submit" className="accent-btn flex-1 py-2.5">
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

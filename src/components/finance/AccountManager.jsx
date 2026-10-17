'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X, CreditCard } from 'lucide-react'

const ICON_KEYWORDS = {
  cash: '💵', bkash: '📱', nagad: '📱', rocket: '📱',
  bank: '🏦', card: '💳', credit: '💳', savings: '🏦',
  wallet: '👛', other: '📂',
}

function getEmoji(name = '') {
  const lower = name.toLowerCase()
  for (const [key, emoji] of Object.entries(ICON_KEYWORDS)) {
    if (lower.includes(key)) return emoji
  }
  return '🏦'
}

function AccountRow({ account, onRename, onDelete, onUpdateBalance, onUpdateCredit }) {
  const isCredit = account.kind === 'credit'
  const [editName, setEditName] = useState(false)
  const [editLimit, setEditLimit] = useState(false)
  const [limitVal, setLimitVal] = useState(String(account.creditLimit ?? ''))
  const [dueVal, setDueVal] = useState(String(account.dueDay || ''))
  const [editBal, setEditBal] = useState(false)
  const [nameVal, setNameVal] = useState(account.name)
  const [balVal, setBalVal] = useState(String(account.startingBalance ?? 0))
  const [err, setErr] = useState('')

  const commitName = () => {
    const result = onRename(account.id, nameVal)
    if (!result?.ok) { setErr(result?.error || 'Error'); return }
    setEditName(false); setErr('')
  }

  const commitLimit = () => {
    const result = onUpdateCredit(account.id, { creditLimit: limitVal, dueDay: Number(dueVal) || 0 })
    if (!result?.ok) { setErr(result?.error || 'Error'); return }
    setEditLimit(false); setErr('')
  }

  const commitBal = () => {
    // A card's opening balance is entered as what's owed and stored negative.
    const result = onUpdateBalance(account.id, isCredit ? -Math.abs(Number(balVal) || 0) : balVal)
    if (!result?.ok) { setErr(result?.error || 'Error'); return }
    setEditBal(false); setErr('')
  }

  const cancelName = () => { setNameVal(account.name); setEditName(false); setErr('') }
  const shownBal = isCredit ? Math.abs(Number(account.startingBalance ?? 0)) : Number(account.startingBalance ?? 0)
  const cancelBal = () => { setBalVal(String(shownBal)); setEditBal(false); setErr('') }

  return (
    <div
      className="rounded-2xl p-4 transition-all"
      style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
    >
      <div className="flex items-start gap-3">
        {/* Emoji icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
          style={{ background: 'rgba(var(--accent-rgb),0.1)' }}
        >
          {isCredit ? '💳' : getEmoji(account.name)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name row */}
          {editName ? (
            <div className="flex items-center gap-2 mb-2">
              <input
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitName(); if (e.key === 'Escape') cancelName() }}
                autoFocus
                className="glass-input flex-1 text-sm py-1.5 min-h-[36px]"
                placeholder="Account name"
              />
              <button type="button" onClick={commitName} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}><Check className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={cancelName} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.08)', color: 'var(--text-2)' }}><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm truncate" style={{ color: 'var(--text-1)' }}>{account.name}</span>
              {isCredit && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)' }}>
                  Credit card
                </span>
              )}
              <button type="button" onClick={() => { setNameVal(account.name); setEditName(true) }} className="p-1 rounded-lg transition-opacity hover:opacity-70" style={{ color: 'var(--text-3)' }}>
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Starting balance row */}
          {editBal ? (
            <div className="flex items-center gap-2">
              <input
                value={balVal}
                onChange={(e) => setBalVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') commitBal(); if (e.key === 'Escape') cancelBal() }}
                autoFocus
                type="number"
                className="glass-input flex-1 text-xs py-1 min-h-[32px]"
                placeholder={isCredit ? 'Owed when added' : 'Starting balance'}
              />
              <button type="button" onClick={commitBal} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}><Check className="w-3 h-3" /></button>
              <button type="button" onClick={cancelBal} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.08)', color: 'var(--text-2)' }}><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => { setBalVal(String(shownBal)); setEditBal(true) }} className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70" style={{ color: 'var(--text-3)' }}>
              <span>{isCredit ? 'Owed when added' : 'Starting balance'}: <strong style={{ color: 'var(--text-2)' }}>{shownBal.toLocaleString()}</strong></span>
              <Pencil className="w-2.5 h-2.5" />
            </button>
          )}

          {isCredit && (editLimit ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                value={limitVal}
                onChange={(e) => setLimitVal(e.target.value)}
                type="number"
                min="0"
                className="glass-input flex-1 text-xs py-1 min-h-[32px]"
                placeholder="Credit limit"
              />
              <input
                value={dueVal}
                onChange={(e) => setDueVal(e.target.value)}
                type="number"
                min="1"
                max="31"
                className="glass-input w-20 text-xs py-1 min-h-[32px]"
                placeholder="Due day"
              />
              <button type="button" onClick={commitLimit} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}><Check className="w-3 h-3" /></button>
              <button type="button" onClick={() => { setEditLimit(false); setErr('') }} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(var(--accent-rgb),0.08)', color: 'var(--text-2)' }}><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button type="button" onClick={() => { setLimitVal(String(account.creditLimit ?? '')); setDueVal(String(account.dueDay || '')); setEditLimit(true) }} className="flex items-center gap-1.5 text-xs mt-1 transition-opacity hover:opacity-70" style={{ color: 'var(--text-3)' }}>
              <span>
                Limit: <strong style={{ color: 'var(--text-2)' }}>{Number(account.creditLimit || 0).toLocaleString()}</strong>
                {account.dueDay ? <> · Bill due day <strong style={{ color: 'var(--text-2)' }}>{account.dueDay}</strong></> : null}
              </span>
              <Pencil className="w-2.5 h-2.5" />
            </button>
          ))}

          {err && <p className="text-xs mt-1 font-semibold" style={{ color: 'var(--danger,#ef4444)' }}>{err}</p>}
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={() => {
            const result = onDelete(account.id)
            if (!result?.ok) setErr(result?.error || 'Cannot delete.')
          }}
          className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
          aria-label="Delete account"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function AccountManager({ accounts, onAdd, onRename, onDelete, onUpdateBalance, onUpdateCredit }) {
  const [name, setName] = useState('')
  const [balance, setBalance] = useState('')
  const [kind, setKind] = useState('standard')
  const [creditLimit, setCreditLimit] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [statementDay, setStatementDay] = useState('')
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleAdd = () => {
    setError('')
    const result = onAdd(name, balance || 0, { kind, creditLimit, dueDay: Number(dueDay) || 0, statementDay: Number(statementDay) || undefined })
    if (!result?.ok) { setError(result?.error || 'Unable to add.'); return }
    closeForm()
  }

  const closeForm = () => {
    setShowForm(false); setName(''); setBalance(''); setKind('standard'); setCreditLimit(''); setDueDay(''); setStatementDay(''); setError('')
  }

  const isCredit = kind === 'credit'

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>Accounts</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="accent-btn px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 min-h-[32px]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add account
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div
          className="rounded-2xl p-4 mb-4"
          style={{ background: 'rgba(var(--accent-rgb),0.06)', border: '1px solid rgba(var(--accent-rgb),0.15)' }}
        >
          <p className="text-xs font-bold mb-3" style={{ color: 'var(--accent)' }}>New account</p>
          <div className="grid grid-cols-2 gap-2 mb-3 p-1 rounded-xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
            {[['standard', 'Cash / Bank'], ['credit', 'Credit card']].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className="py-2 rounded-lg text-xs font-bold transition-all min-h-[36px]"
                style={{
                  background: kind === k ? 'rgba(var(--accent-rgb),0.14)' : 'transparent',
                  color: kind === k ? 'var(--accent)' : 'var(--text-3)',
                  boxShadow: kind === k ? 'inset 0 0 0 1.5px var(--accent)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                placeholder={isCredit ? 'City Bank Visa, Amex…' : 'bKash, City Bank, Cash…'}
                className="glass-input min-h-[44px]"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>{isCredit ? 'Currently owed' : 'Starting balance'}</label>
              <input
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                type="number"
                placeholder="0"
                className="glass-input min-h-[44px]"
              />
            </div>
            {isCredit && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Credit limit *</label>
                  <input
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    type="number"
                    min="0"
                    placeholder="100000"
                    className="glass-input min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Statement day (1–31)</label>
                  <input
                    value={statementDay}
                    onChange={(e) => setStatementDay(e.target.value)}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="25"
                    className="glass-input min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Bill due day (1–31)</label>
                  <input
                    value={dueDay}
                    onChange={(e) => setDueDay(e.target.value)}
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    className="glass-input min-h-[44px]"
                  />
                </div>
              </>
            )}
          </div>
          {isCredit && (
            <p className="text-[11px] mb-3" style={{ color: 'var(--text-3)' }}>
              Spending on the card raises what you owe. Each month a statement is generated on the statement day; open the card from Accounts to see bills, minimum due, EMIs and to pay — a payment moves money from another account, so it isn&apos;t counted as a new expense.
            </p>
          )}
          {error && <p className="text-xs font-semibold mb-2" style={{ color: 'var(--danger,#ef4444)' }}>{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={handleAdd} className="accent-btn px-4 py-2 text-sm font-bold">Add</button>
            <button type="button" onClick={closeForm} className="px-4 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-70" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-2)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Account list */}
      <div className="space-y-3">
        {accounts.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>No accounts yet.</p>
        ) : (
          accounts.map((acc) => (
            <AccountRow
              key={acc.id}
              account={acc}
              onRename={onRename}
              onDelete={onDelete}
              onUpdateBalance={onUpdateBalance}
              onUpdateCredit={onUpdateCredit}
            />
          ))
        )}
      </div>
    </div>
  )
}

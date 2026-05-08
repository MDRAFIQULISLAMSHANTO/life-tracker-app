'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, TrendingDown, TrendingUp, ArrowLeftRight, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFinance } from '../../context/FinanceContext'

// Base field style — full width, consistent height, custom border
const F = {
  width: '100%',
  height: 46,
  padding: '0 12px',
  borderRadius: 12,
  fontSize: 15,
  fontWeight: 500,
  border: '1px solid var(--card-border)',
  background: 'var(--input-bg)',
  color: 'var(--text-1)',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  appearance: 'none',
  WebkitAppearance: 'none',
  display: 'block',
}
const TA = { ...F, height: 'auto', minHeight: 70, padding: '10px 12px', resize: 'none' }
const L = {
  display: 'block', fontSize: 10, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-3)', marginBottom: 5,
}

// Two-column grid — collapses to 1 col on very narrow screens via minmax
const grid2 = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
}

function BottomSheet({ title, onClose, children }) {
  return (
    <>
      <div
        className="fixed inset-0 z-[60] lg:hidden"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] lg:hidden scroll-touch"
        style={{
          background: 'var(--surface-2)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRadius: '22px 22px 0 0',
          padding: '12px 20px max(28px,env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.16)',
          border: '1px solid var(--card-border)',
          borderBottom: 'none',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: 40, height: 4, background: 'rgba(150,150,150,0.30)', borderRadius: 2, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(120,120,140,0.12)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
              border: '1px solid rgba(120,120,140,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
              color: 'var(--text-2)', cursor: 'pointer',
            }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>
        {children}
      </div>
    </>
  )
}

function SubmitBtn({ color, shadow, children }) {
  return (
    <button type="submit" style={{
      width: '100%', height: 50, borderRadius: 14, border: 'none', cursor: 'pointer',
      background: color, color: '#fff', fontSize: 15, fontWeight: 700,
      boxShadow: shadow, fontFamily: 'inherit',
    }}>
      {children}
    </button>
  )
}

function IncomeForm({ onClose }) {
  const { incomeCategories, accounts, addTransaction } = useFinance()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(incomeCategories[0] || 'Other')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault(); setError('')
    const r = addTransaction({ type: 'income', amount, category, description, date, accountId })
    if (!r.ok) { setError(r.error || 'Failed'); return }
    onClose()
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={grid2}>
        <div>
          <label style={L}>Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            step="0.01" min="0" placeholder="0.00" required style={F} inputMode="decimal" />
        </div>
        <div>
          <label style={L}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={F}>
            {(incomeCategories.length ? incomeCategories : ['Other']).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={L}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...F, appearance: 'auto', WebkitAppearance: 'auto' }} />
        </div>
        <div>
          <label style={L}>Account</label>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} style={F}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={L}>Note (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Add a note…" rows={2} style={TA} />
      </div>
      {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
      <SubmitBtn color="#16a34a" shadow="0 4px 16px rgba(22,163,74,0.28)">Add Income</SubmitBtn>
    </form>
  )
}

function ExpenseForm({ onClose }) {
  const { expenseCategories, accounts, addTransaction } = useFinance()
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(expenseCategories[0] || 'Other')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault(); setError('')
    const r = addTransaction({ type: 'expense', amount, category, description, date, accountId })
    if (!r.ok) { setError(r.error || 'Failed'); return }
    onClose()
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={grid2}>
        <div>
          <label style={L}>Amount</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            step="0.01" min="0" placeholder="0.00" required style={F} inputMode="decimal" />
        </div>
        <div>
          <label style={L}>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={F}>
            {(expenseCategories.length ? expenseCategories : ['Other']).map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={L}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...F, appearance: 'auto', WebkitAppearance: 'auto' }} />
        </div>
        <div>
          <label style={L}>Account</label>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} style={F}>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={L}>Note (optional)</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Add a note…" rows={2} style={TA} />
      </div>
      {error && <p style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600, margin: 0 }}>{error}</p>}
      <SubmitBtn color="#dc2626" shadow="0 4px 16px rgba(220,38,38,0.28)">Add Expense</SubmitBtn>
    </form>
  )
}

// Income=0, Expense=1, Transfer=2 — in that order per user request
const ACTIONS = [
  { id: 'income',   label: 'Income',   Icon: TrendingUp },
  { id: 'expense',  label: 'Expense',  Icon: TrendingDown },
  { id: 'transfer', label: 'Transfer', Icon: ArrowLeftRight, navigate: '/dashboard/accounts' },
]

export default function MobileTabBar() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const pillRefs    = useRef([])
  const backdropRef = useRef(null)
  const router      = useRouter()

  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      const pills = pillRefs.current.filter(Boolean)
      if (open && pills.length) {
        if (backdropRef.current) {
          gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
        }
        gsap.fromTo(pills,
          { y: 18, opacity: 0, scale: 0.84 },
          { y: 0, opacity: 1, scale: 1, duration: 0.30, stagger: 0.065, ease: 'back.out(2.0)' }
        )
      }
    }).catch(() => {})
  }, [open])

  const handleAction = (action) => {
    setOpen(false)
    if (action.navigate) {
      router.push(action.navigate)
    } else {
      setModal(action.id)
    }
  }

  return (
    <>
      {/* Bottom sheet modals */}
      {modal === 'income' && (
        <BottomSheet title="Add Income" onClose={() => setModal(null)}>
          <IncomeForm onClose={() => setModal(null)} />
        </BottomSheet>
      )}
      {modal === 'expense' && (
        <BottomSheet title="Add Expense" onClose={() => setModal(null)}>
          <ExpenseForm onClose={() => setModal(null)} />
        </BottomSheet>
      )}

      {/* FAB backdrop */}
      {open && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* White glass action pills */}
      {open && (
        <div
          className="fixed z-50 lg:hidden flex flex-col gap-3"
          style={{
            bottom: 'calc(max(1.5rem, env(safe-area-inset-bottom)) + 72px)',
            right: '1.25rem',
            alignItems: 'flex-end',
          }}
        >
          {ACTIONS.map(({ id, label, Icon, navigate }, i) => (
            <button
              key={id}
              ref={el => { pillRefs.current[i] = el }}
              type="button"
              onClick={() => handleAction({ id, navigate })}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                borderRadius: 999,
                paddingTop: 10, paddingBottom: 10, paddingLeft: 18, paddingRight: 22,
                background: 'rgba(255,255,255,0.20)',
                backdropFilter: 'blur(40px) brightness(1.12) saturate(1.6)',
                WebkitBackdropFilter: 'blur(40px) brightness(1.12) saturate(1.6)',
                border: '1px solid rgba(255,255,255,0.35)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.28)',
                color: 'rgba(255,255,255,0.92)',
                fontWeight: 700,
                fontSize: '0.88rem',
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.78)' }} strokeWidth={2.2} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* FAB button — glass style */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="lg:hidden fixed z-50 flex items-center justify-center rounded-full text-white"
        style={{
          width: 56, height: 56,
          bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))',
          right: '1.25rem',
          background: 'rgba(18,18,28,0.82)',
          backdropFilter: 'blur(24px) saturate(1.3)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
          border: open
            ? '1px solid rgba(255,255,255,0.16)'
            : '1.5px solid rgba(255,255,255,0.18)',
          boxShadow: open
            ? '0 4px 18px rgba(0,0,0,0.45)'
            : '0 6px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)',
          transition: 'border 0.2s ease, box-shadow 0.2s ease',
        }}
        aria-label={open ? 'Close' : 'Quick add'}
      >
        <Plus
          style={{
            width: 26, height: 26,
            transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            transform: open ? 'rotate(45deg)' : 'none',
          }}
          strokeWidth={2.5}
        />
      </button>
    </>
  )
}

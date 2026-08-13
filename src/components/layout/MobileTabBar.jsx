'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowLeftRight,
  LayoutDashboard,
  ListChecks,
  Moon,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useFinance } from '../../context/FinanceContext'
import { formatCurrency } from '../../utils/formatters'
import { Button, Field, Input, Select, Sheet, Textarea } from '../ui'

const TABS = [
  { href: '/dashboard', label: 'Home', Icon: LayoutDashboard },
  { href: '/dashboard/tasks', label: 'Tasks', Icon: ListChecks },
  { href: '/dashboard/ledger', label: 'Money', Icon: Wallet },
  { href: '/dashboard/growth', label: 'Growth', Icon: Sparkles },
  { href: '/dashboard/plan', label: 'Plan', Icon: Moon },
]

function TransactionForm({ type, onClose }) {
  const { incomeCategories, expenseCategories, accounts, addTransaction, currency } = useFinance()
  const categories = type === 'income' ? incomeCategories : expenseCategories
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(categories[0] || 'Other')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  const accent = type === 'income' ? '#16a34a' : '#dc2626'

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const r = addTransaction({ type, amount, category, description, date, accountId })
    if (!r.ok) {
      setError(r.error || 'Failed')
      return
    }
    setToast(`${formatCurrency(Number(amount), currency)} · ${category}`)
    setTimeout(onClose, 1200)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount">
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0"
            placeholder="0.00"
            inputMode="decimal"
            required
            autoFocus
          />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {(categories.length ? categories : ['Other']).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Account">
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Note (optional)">
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a note…" />
      </Field>
      {error && (
        <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}
      {toast ? (
        <div
          className="rounded-2xl px-4 py-3 text-center text-sm font-bold text-white"
          style={{ background: accent }}
          role="status"
        >
          {type === 'income' ? 'Income' : 'Expense'} added — {toast}
        </div>
      ) : (
        <Button
          type="submit"
          size="lg"
          full
          style={{ background: accent, boxShadow: `0 4px 16px ${accent}47`, color: '#fff' }}
          className=""
        >
          Add {type === 'income' ? 'income' : 'expense'}
        </Button>
      )}
    </form>
  )
}

const ACTIONS = [
  { id: 'income', label: 'Income', Icon: TrendingUp },
  { id: 'expense', label: 'Expense', Icon: TrendingDown },
  { id: 'transfer', label: 'Transfer', Icon: ArrowLeftRight, navigate: '/dashboard/accounts' },
]

export default function MobileTabBar() {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const pillRefs = useRef([])
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!open) return
    import('gsap')
      .then(({ gsap }) => {
        const pills = pillRefs.current.filter(Boolean)
        if (pills.length) {
          gsap.fromTo(
            pills,
            { y: 18, opacity: 0, scale: 0.84 },
            { y: 0, opacity: 1, scale: 1, duration: 0.3, stagger: 0.065, ease: 'back.out(2.0)' }
          )
        }
      })
      .catch(() => {})
  }, [open])

  // Close the action menu whenever the route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const handleAction = (action) => {
    setOpen(false)
    if (action.navigate) router.push(action.navigate)
    else setModal(action.id)
  }

  const isActive = (href) =>
    href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)

  return (
    <>
      <Sheet open={modal === 'income'} onClose={() => setModal(null)} title="Add income">
        <TransactionForm type="income" onClose={() => setModal(null)} />
      </Sheet>
      <Sheet open={modal === 'expense'} onClose={() => setModal(null)} title="Add expense">
        <TransactionForm type="expense" onClose={() => setModal(null)} />
      </Sheet>

      {/* Action-menu backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close quick add"
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div
          className="fixed z-50 flex flex-col items-end gap-3 lg:hidden"
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 9rem)', right: '1.25rem' }}
        >
          {ACTIONS.map((action, i) => (
            <button
              key={action.id}
              ref={(el) => {
                pillRefs.current[i] = el
              }}
              type="button"
              onClick={() => handleAction(action)}
              className="flex items-center gap-2.5 rounded-full px-5 py-2.5 text-sm font-bold text-white"
              style={{
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(30px) saturate(1.6)',
                WebkitBackdropFilter: 'blur(30px) saturate(1.6)',
                border: '1px solid rgba(255,255,255,0.32)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
              }}
            >
              <action.Icon className="h-4 w-4" strokeWidth={2.2} />
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed z-50 flex items-center justify-center rounded-full text-white lg:hidden"
        style={{
          width: 54,
          height: 54,
          bottom: 'calc(env(safe-area-inset-bottom) + 4.75rem)',
          right: '1.25rem',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          boxShadow: '0 8px 28px rgba(99,102,241,0.45)',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
        aria-label={open ? 'Close quick add' : 'Quick add'}
        aria-expanded={open}
      >
        <Plus
          className="h-6 w-6"
          strokeWidth={2.5}
          style={{
            transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
            transform: open ? 'rotate(45deg)' : 'none',
          }}
        />
      </button>

      {/* Bottom tab bar */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
        style={{
          background: 'var(--topbar-bg)',
          backdropFilter: 'var(--blur)',
          WebkitBackdropFilter: 'var(--blur)',
          borderTop: '1px solid var(--card-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="mx-auto flex max-w-lg items-stretch justify-around">
          {TABS.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-transform active:scale-95"
                style={{ color: active ? 'var(--accent)' : 'var(--text-3)', minHeight: 56 }}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} aria-hidden />
                <span className="text-[10px] font-bold tracking-tight">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

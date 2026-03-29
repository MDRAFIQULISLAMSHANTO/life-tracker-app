'use client'

import { useState, useMemo } from 'react'
import { User, Wallet, RotateCcw, CalendarRange, Settings2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { useDashboardToday } from '../../../context/DashboardTodayContext'
import CategoryManager from '../../../components/finance/CategoryManager'
import { CURRENCY_OPTIONS } from '../../../utils/currencyOptions'

const MONTHS = [
  { v: 1, label: 'January' },
  { v: 2, label: 'February' },
  { v: 3, label: 'March' },
  { v: 4, label: 'April' },
  { v: 5, label: 'May' },
  { v: 6, label: 'June' },
  { v: 7, label: 'July' },
  { v: 8, label: 'August' },
  { v: 9, label: 'September' },
  { v: 10, label: 'October' },
  { v: 11, label: 'November' },
  { v: 12, label: 'December' },
]

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const {
    currency,
    setCurrency,
    expenseCategories,
    incomeCategories,
    otherCategories,
    addCategory,
    removeCategory,
    resetFinanceDataForMonth,
  } = useFinance()

  const { resetDashboardForMonth } = useDashboardToday()

  const [msg, setMsg] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [resetYear, setResetYear] = useState(new Date().getFullYear())
  const [resetMonth, setResetMonth] = useState(new Date().getMonth() + 1)
  const [confirmText, setConfirmText] = useState('')

  const optionsForSelect = useMemo(() => {
    const q = currencyFilter.trim().toLowerCase()
    const current = CURRENCY_OPTIONS.find((c) => c.code === currency)
    const base = q
      ? CURRENCY_OPTIONS.filter(
          (c) => c.code.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
        )
      : CURRENCY_OPTIONS
    if (base.length === 0) {
      return current ? [current] : []
    }
    if (q && current && !base.some((c) => c.code === current.code)) {
      return [current, ...base]
    }
    return base
  }, [currencyFilter, currency])

  if (loading) return <div className="text-text-secondary">Loading...</div>
  if (!user) return null

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i)

  const runReset = () => {
    if (confirmText.trim().toUpperCase() !== 'RESET') {
      setMsg('Type RESET to confirm.')
      setTimeout(() => setMsg(''), 3000)
      return
    }
    resetFinanceDataForMonth(resetYear, resetMonth)
    resetDashboardForMonth(resetYear, resetMonth)
    setConfirmText('')
    setResetOpen(false)
    setMsg(`All data for ${resetYear}-${String(resetMonth).padStart(2, '0')} was cleared.`)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-24">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Settings2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base font-medium">
            Profile, currency, month reset, and category lists in one place.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[1.75rem] sm:rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
        <section className="p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Profile</h2>
          </div>
          <p className="text-sm text-text-secondary">Signed in as</p>
          <p className="mt-1 font-semibold text-text-primary break-all text-sm sm:text-base">{user.email || user.uid}</p>
        </section>

        <section className="p-5 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Finance</h2>
          </div>

          <label className="block text-sm font-semibold text-text-primary mb-2">Currency (ISO 4217)</label>
          <p className="text-sm text-text-secondary mb-3">All amounts in the app use this currency.</p>
          <input
            type="search"
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            placeholder="Filter by code or name (e.g. EUR, euro)…"
            className="w-full px-4 py-2.5 mb-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            autoComplete="off"
          />
          <select
            value={currency}
            onChange={(e) => {
              const res = setCurrency(e.target.value)
              if (!res.ok) setMsg(res.error || 'Invalid currency')
              else setMsg('')
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm min-h-[48px]"
          >
            {optionsForSelect.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          {optionsForSelect.length === 0 && (
            <p className="text-sm text-text-secondary mt-2">No currencies match your filter. Clear the filter to see all.</p>
          )}

          {msg && <div className="text-sm text-success font-semibold mt-4">{msg}</div>}

          <div className="mt-8 border border-gray-200 rounded-2xl p-5 bg-gray-50/80">
            <div className="flex items-start gap-3 mb-4">
              <CalendarRange className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-text-primary">Reset data for a month</h3>
                <p className="text-sm text-text-secondary mt-1">
                  Removes transactions and loans dated in that month, clears budgets for that month, and clears events, reminders, and notes for that month. Categories, accounts, and currency are kept.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setResetOpen(true)
                setConfirmText('')
              }}
              className="px-4 py-2.5 rounded-xl border border-danger text-danger font-semibold hover:bg-red-50 transition-colors inline-flex items-center gap-2 min-h-[44px]"
            >
              <RotateCcw className="w-4 h-4" />
              Reset month data…
            </button>
          </div>
        </section>

        <section className="p-5 sm:p-8 space-y-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-gray-900">Categories</h2>
          <div className="grid grid-cols-1 gap-6">
            <CategoryManager
              title="Expense categories"
              categories={expenseCategories}
              onAdd={(name) => addCategory('expense', name)}
              onRemove={(name) => removeCategory('expense', name)}
            />
            <CategoryManager
              title="Income categories"
              categories={incomeCategories}
              onAdd={(name) => addCategory('income', name)}
              onRemove={(name) => removeCategory('income', name)}
            />
            <CategoryManager
              title="Other categories"
              categories={otherCategories}
              onAdd={(name) => addCategory('other', name)}
              onRemove={(name) => removeCategory('other', name)}
            />
          </div>
        </section>
      </div>

      {resetOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={() => setResetOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-text-primary mb-2">Reset month data</h3>
            <p className="text-sm text-text-secondary mb-4">Choose the calendar month to wipe. This cannot be undone.</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Year</label>
                <select
                  value={resetYear}
                  onChange={(e) => setResetYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white min-h-[44px]"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Month</label>
                <select
                  value={resetMonth}
                  onChange={(e) => setResetMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white min-h-[44px]"
                >
                  {MONTHS.map((m) => (
                    <option key={m.v} value={m.v}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Type <span className="font-mono text-danger">RESET</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl mb-4 min-h-[44px]"
              placeholder="RESET"
              autoComplete="off"
            />
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setResetOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 font-semibold text-text-primary hover:bg-gray-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runReset}
                className="px-4 py-2.5 rounded-xl bg-danger text-white font-semibold hover:bg-red-600 min-h-[44px]"
              >
                Erase data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

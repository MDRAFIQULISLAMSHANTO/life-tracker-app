'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Edit3, Plus, Save, Trash2, Wallet } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency } from '../../../utils/formatters'

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

  const sorted = useMemo(() => {
    return [...loans].sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate))
  }, [loans])

  const visible = useMemo(() => {
    return sorted.filter(
      (l) => l.borrowDate && String(l.borrowDate).slice(0, 7) === ledgerMonthKey
    )
  }, [sorted, ledgerMonthKey])

  const totals = useMemo(() => {
    const totalBorrowed = visible.reduce((s, l) => s + Number(l.amount || 0), 0)
    const incomeCounted = visible.filter((l) => l.addToIncome).reduce((s, l) => s + Number(l.amount || 0), 0)
    return { totalBorrowed, incomeCounted }
  }, [visible])

  if (loading) {
    return <div className="text-text-secondary">Loading...</div>
  }
  if (!user) return null

  const resetForm = () => {
    setEditingId(null)
    setAmount('')
    setBorrowDate(new Date().toISOString().slice(0, 10))
    setExtendedDate(new Date().toISOString().slice(0, 10))
    setReason('')
    setAddToIncome(true)
    setError('')
  }

  const startEdit = (l) => {
    setEditingId(l.id)
    setAmount(String(l.amount ?? ''))
    setBorrowDate(l.borrowDate || new Date().toISOString().slice(0, 10))
    setExtendedDate(l.extendedDate || new Date().toISOString().slice(0, 10))
    setReason(l.reason || '')
    setAddToIncome(!!l.addToIncome)
    setError('')
  }

  const onSubmit = (e) => {
    e.preventDefault()
    setError('')
    const result = upsertLoan({ id: editingId || undefined, amount, borrowDate, extendedDate, reason, addToIncome })
    if (!result.ok) {
      setError(result.error || 'Unable to save loan.')
      return
    }
    resetForm()
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Loans</h1>
          <p className="text-gray-500 mt-2 font-medium">
            Track borrowed money with due/extended date and optionally count it as income when received. List and totals use the ledger month{' '}
            <span className="font-semibold text-text-primary">{ledgerMonthKey}</span> (header).
          </p>
        </div>

        <div className="flex gap-3">
          <div className="bg-background-card rounded-2xl p-4 shadow-soft">
            <div className="text-xs font-bold tracking-wide text-text-secondary uppercase">Total borrowed</div>
            <div className="text-xl font-extrabold text-text-primary">{formatCurrency(totals.totalBorrowed, currency)}</div>
          </div>
          <div className="bg-background-card rounded-2xl p-4 shadow-soft">
            <div className="text-xs font-bold tracking-wide text-text-secondary uppercase">As income (this month)</div>
            <div className="text-xl font-extrabold text-text-primary">{formatCurrency(totals.incomeCounted, currency)}</div>
          </div>
        </div>
      </div>

      {/* Create / Edit */}
      <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-gray-100/50">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="w-5 h-5" />
            </span>
            {editingId ? 'Edit Loan' : 'New Loan'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-xl border border-gray-300 text-text-primary font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.01"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="addToIncome"
              type="checkbox"
              checked={addToIncome}
              onChange={(e) => setAddToIncome(e.target.checked)}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="addToIncome" className="text-sm font-semibold text-text-primary">
              Add to finance income when loan is taken
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Borrow date</label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={borrowDate}
                onChange={(e) => setBorrowDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Extended/due date</label>
            <div className="relative">
              <CalendarDays className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={extendedDate}
                onChange={(e) => setExtendedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-2">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="Why did you borrow? (emergency, business, investment...)"
            />
          </div>

          {error && <div className="md:col-span-2 text-sm text-danger">{error}</div>}

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-5 py-3 rounded-xl border border-gray-300 text-text-primary font-semibold hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Save Loan' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-gray-100/50">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-6">Your Loans</h2>

        {visible.length === 0 ? (
          <div className="text-text-secondary">
            No loans with borrow date in {ledgerMonthKey}. Change the month in the header or add a loan dated in this month.
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((l) => (
              <div key={l.id} className="border border-gray-100 rounded-2xl p-5 hover:bg-gray-50/40 transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xl font-extrabold text-gray-900">
                        {formatCurrency(Number(l.amount || 0), currency)}
                      </div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 bg-white">
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        {l.addToIncome ? 'Income' : 'Loan only'}
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-text-secondary">
                      Borrowed: <span className="font-semibold text-text-primary">{l.borrowDate}</span> • Due/Extended:{' '}
                      <span className="font-semibold text-text-primary">{l.extendedDate}</span>
                    </div>

                    {l.reason && <div className="mt-2 text-sm text-text-secondary">{l.reason}</div>}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(l)}
                      className="px-4 py-2 rounded-xl border border-gray-300 text-text-primary font-semibold hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLoan(l.id)}
                      className="px-4 py-2 rounded-xl bg-danger text-white font-semibold hover:bg-red-600 transition-colors inline-flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import CategoryManager from '../../../components/finance/CategoryManager'
import { formatCurrency } from '../../../utils/formatters'

export default function ExpensesPage() {
  const { user, loading } = useAuth()
  const {
    currency,
    ledgerMonthKey,
    expenseCategories,
    accounts,
    transactions,
    addCategory,
    removeCategory,
    addTransaction,
    deleteTransaction,
  } = useFinance()

  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(expenseCategories[0] || 'Other')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [accountId, setAccountId] = useState(accounts[0]?.id || '')
  const [submitError, setSubmitError] = useState('')

  const expenseTx = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.type === 'expense' && t.date && String(t.date).slice(0, 7) === ledgerMonthKey
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, ledgerMonthKey])

  const totalExpense = useMemo(() => {
    return expenseTx.reduce((sum, t) => sum + Number(t.amount || 0), 0)
  }, [expenseTx])

  if (loading) return <div className="text-text-secondary">Loading...</div>
  if (!user) return null

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Expenses</h1>
          <p className="text-gray-500 mt-2 font-medium">
            Add expenses and manage expense categories. Lists follow the ledger month <span className="font-semibold text-text-primary">{ledgerMonthKey}</span> (header).
          </p>
        </div>
        <div className="bg-background-card rounded-2xl p-4 shadow-soft">
          <div className="text-sm text-text-secondary">Total Expenses</div>
          <div className="text-2xl font-bold text-text-primary">{formatCurrency(totalExpense, currency)}</div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-gray-100/50">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-6 flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <Plus className="w-5 h-5" />
          </span>
          Add Expense
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSubmitError('')
            const result = addTransaction({ type: 'expense', amount, category, description, date, accountId })
            if (!result.ok) {
              setSubmitError(result.error || 'Failed to add expense.')
              return
            }
            setAmount('')
            setDescription('')
            setCategory(expenseCategories[0] || 'Other')
          }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
            >
              {(expenseCategories?.length ? expenseCategories : ['Other']).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Account</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none bg-white"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-primary mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
            />
          </div>

          {submitError && <div className="md:col-span-2 text-sm text-danger">{submitError}</div>}

          <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setSubmitError('')} className="px-5 py-3 rounded-xl border border-gray-300 text-text-primary font-semibold hover:bg-gray-50 transition-colors">
              Clear
            </button>
            <button type="submit" className="px-5 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 transition-colors">
              Add Expense
            </button>
          </div>
        </form>
      </div>

      <CategoryManager
        title="Expense Categories"
        categories={expenseCategories}
        onAdd={(name) => addCategory('expense', name)}
        onRemove={(name) => removeCategory('expense', name)}
      />

      <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-gray-100/50">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-6">All Expenses</h2>

        {expenseTx.length === 0 ? (
          <div className="text-text-secondary">No expenses yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary">
                  <th className="py-3 px-2 font-medium">Date</th>
                  <th className="py-3 px-2 font-medium">Category</th>
                  <th className="py-3 px-2 font-medium">Description</th>
                  <th className="py-3 px-2 font-medium">Amount</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenseTx.map((t) => (
                  <tr key={t.id} className="border-t border-gray-100 hover:bg-gray-50/40">
                    <td className="py-3 px-2 whitespace-nowrap">{t.date}</td>
                    <td className="py-3 px-2 font-medium text-text-primary">{t.category}</td>
                    <td className="py-3 px-2 text-text-secondary max-w-[280px] truncate">{t.description || '-'}</td>
                    <td className="py-3 px-2 font-semibold text-danger whitespace-nowrap">
                      -{formatCurrency(Number(t.amount || 0), currency)}
                    </td>
                    <td className="py-3 px-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-300 text-text-primary hover:bg-gray-50 transition-colors"
                        onClick={() => deleteTransaction(t.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}


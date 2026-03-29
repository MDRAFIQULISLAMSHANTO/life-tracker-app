'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, PieChart } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency, getCurrencySymbol } from '../../../utils/formatters'

export default function BudgetPage() {
  const { user, loading } = useAuth()
  const {
    currency,
    ledgerMonthKey,
    budgetRowsFull,
    setBudgetForCategory,
    clearBudgetForCategory,
  } = useFinance()

  const [drafts, setDrafts] = useState({})
  const [msg, setMsg] = useState('')

  const rows = budgetRowsFull

  const displayRows = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      draft: drafts[r.category] !== undefined ? drafts[r.category] : String(r.budget || ''),
    }))
  }, [rows, drafts])

  if (loading) return <div className="text-text-secondary">Loading...</div>
  if (!user) return null

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <PieChart className="w-5 h-5" />
            </span>
            Budgets
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Set spending limits per expense category for <span className="font-semibold text-text-primary">{ledgerMonthKey}</span>.
            Amounts use your app currency ({getCurrencySymbol(currency)} · {currency}) only.
          </p>
        </div>
      </div>

      {msg && <div className="text-sm text-success font-semibold">{msg}</div>}

      <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-gray-100/50 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-gray-100">
              <th className="py-3 pr-4 font-medium">Category</th>
              <th className="py-3 pr-4 font-medium">Spent (this month)</th>
              <th className="py-3 pr-4 font-medium">Budget</th>
              <th className="py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr key={row.category} className="border-b border-gray-50 hover:bg-gray-50/40">
                <td className="py-4 pr-4 font-semibold text-text-primary">{row.category}</td>
                <td className="py-4 pr-4 whitespace-nowrap">{formatCurrency(row.spent, currency)}</td>
                <td className="py-4 pr-4">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.draft}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [row.category]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full max-w-[140px] px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </td>
                <td className="py-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-600 mr-2"
                    onClick={() => {
                      const raw = drafts[row.category] !== undefined ? drafts[row.category] : String(row.budget || '')
                      const num = parseFloat(String(raw).replace(',', '.'))
                      if (!Number.isFinite(num) || num < 0) {
                        setMsg('Enter a valid budget ≥ 0.')
                        setTimeout(() => setMsg(''), 2500)
                        return
                      }
                      setBudgetForCategory(ledgerMonthKey, row.category, num)
                      setDrafts((d) => {
                        const next = { ...d }
                        delete next[row.category]
                        return next
                      })
                      setMsg('Budget saved.')
                      setTimeout(() => setMsg(''), 2000)
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-xl border border-gray-300 text-text-primary text-xs font-semibold hover:bg-gray-50"
                    onClick={() => {
                      clearBudgetForCategory(ledgerMonthKey, row.category)
                      setDrafts((d) => {
                        const next = { ...d }
                        delete next[row.category]
                        return next
                      })
                      setMsg('Budget cleared.')
                      setTimeout(() => setMsg(''), 2000)
                    }}
                  >
                    Clear
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

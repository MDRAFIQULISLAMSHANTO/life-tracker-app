'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Target } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency } from '../../../utils/formatters'

export default function GoalsPage() {
  const { user, loading } = useAuth()
  const { currency, transactions } = useFinance()

  const stats = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
    const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
    const savings = income - expense
    return { income, expense, savings }
  }, [transactions])

  if (loading) return <div className="text-text-secondary">Loading...</div>
  if (!user) return null

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Goals</h1>
        <p className="text-gray-500 mt-2 font-medium">
          A practical MVP: savings overview + link to Goal trackers. (Next: dedicated goal objects and progress.)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-background-card rounded-2xl p-6 shadow-soft">
          <div className="text-sm text-text-secondary">Total Income</div>
          <div className="text-2xl font-extrabold text-text-primary mt-2">{formatCurrency(stats.income, currency)}</div>
        </div>
        <div className="bg-background-card rounded-2xl p-6 shadow-soft">
          <div className="text-sm text-text-secondary">Total Expense</div>
          <div className="text-2xl font-extrabold text-danger mt-2">{formatCurrency(stats.expense, currency)}</div>
        </div>
        <div className="bg-background-card rounded-2xl p-6 shadow-soft">
          <div className="text-sm text-text-secondary">Savings</div>
          <div className="text-2xl font-extrabold text-text-primary mt-2">{formatCurrency(stats.savings, currency)}</div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 lg:p-10 shadow-sm border border-gray-100/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Goal Trackers</h2>
        </div>
        <p className="text-text-secondary">
          For now, goals are managed as Trackers with the “Goal” format. Create one from Templates in Trackers.
        </p>
        <div className="mt-5">
          <Link
            href="/dashboard/trackers"
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors"
          >
            Go to Trackers
          </Link>
        </div>
      </div>
    </div>
  )
}


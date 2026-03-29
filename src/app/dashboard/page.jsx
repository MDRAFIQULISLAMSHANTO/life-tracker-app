'use client'

import { useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import SummaryCard from '../../components/dashboard/SummaryCard'

const ExpenseDonutChart = dynamic(() => import('../../components/charts/ExpenseDonutChart'), {
  loading: () => (
    <div
      className="h-[280px] animate-pulse rounded-[1.25rem] border border-white/55 bg-white/42 shadow-glass backdrop-blur-xl lg:h-[300px] lg:rounded-xl lg:bg-white/48"
      aria-hidden
    />
  ),
  ssr: false,
})
const DailyTrendChart = dynamic(() => import('../../components/charts/DailyTrendChart'), {
  loading: () => (
    <div
      className="h-[280px] animate-pulse rounded-[1.25rem] border border-white/55 bg-white/42 shadow-glass backdrop-blur-xl lg:h-[300px] lg:rounded-xl lg:bg-white/48"
      aria-hidden
    />
  ),
  ssr: false,
})
import BudgetStatus from '../../components/dashboard/BudgetStatus'
import TodayEvents from '../../components/dashboard/TodayEvents'
import TodayReminders from '../../components/dashboard/TodayReminders'
import QuickNotes from '../../components/dashboard/QuickNotes'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'

function buildDailyTrend(ledgerMonthKey, transactions) {
  if (!ledgerMonthKey) return []
  const [y, m] = ledgerMonthKey.split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return []
  const daysInMonth = new Date(y, m, 0).getDate()
  const rows = Array.from({ length: daysInMonth }, (_, i) => ({
    date: String(i + 1),
    income: 0,
    expense: 0,
  }))
  transactions
    .filter((t) => t.date && String(t.date).slice(0, 7) === ledgerMonthKey)
    .forEach((t) => {
      const day = parseInt(String(t.date).slice(8, 10), 10) - 1
      if (day < 0 || day >= daysInMonth) return
      const n = Number(t.amount || 0)
      if (t.type === 'income') rows[day].income += n
      else if (t.type === 'expense') rows[day].expense += n
    })
  return rows
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const {
    currency,
    ledgerMonthKey,
    transactionsInLedgerMonth,
    monthIncome,
    monthExpense,
    monthNet,
    lifetimeNet,
    expenseByCategory,
    budgetRows,
    transactions,
  } = useFinance()

  const expenseData = useMemo(() => {
    return Object.entries(expenseByCategory)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
  }, [expenseByCategory])

  const dailyTrendData = useMemo(
    () => buildDailyTrend(ledgerMonthKey, transactions),
    [ledgerMonthKey, transactions]
  )

  const recentActivities = useMemo(() => {
    return transactionsInLedgerMonth
      .filter((t) => t.type === 'income' || t.type === 'expense')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15)
      .map((t) => ({
        id: t.id,
        type: t.type,
        title: t.description || t.category || 'Transaction',
        amount: t.type === 'income' ? Number(t.amount || 0) : -Number(t.amount || 0),
        category: t.category,
        time: t.date,
      }))
  }, [transactionsInLedgerMonth])

  const summaryData = useMemo(
    () => ({
      balance: {
        value: formatCurrency(lifetimeNet, currency),
        change: 'All time',
        changeType: 'neutral',
      },
      income: {
        value: formatCurrency(monthIncome, currency),
        change: 'This month',
        changeType: 'neutral',
      },
      expense: {
        value: formatCurrency(monthExpense, currency),
        change: 'This month',
        changeType: 'neutral',
      },
      savings: {
        value: formatCurrency(monthNet, currency),
        change: 'This month',
        changeType: 'neutral',
      },
    }),
    [currency, lifetimeNet, monthIncome, monthExpense, monthNet]
  )

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-sm:space-y-4 space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <p className="text-xs leading-relaxed text-neutral-600 sm:text-sm sm:text-text-secondary">
          <span className="sm:hidden">
            <span className="font-semibold text-neutral-900">{ledgerMonthKey}</span>
            <span> · month follows the header</span>
          </span>
          <span className="hidden sm:inline">
            Ledger month <span className="font-semibold text-text-primary">{ledgerMonthKey}</span> — totals and charts
            follow the month selector in the header.
          </span>
        </p>
        <Link
          href="/dashboard/budget"
          className="inline-flex min-h-[40px] w-fit items-center rounded-full border border-white/50 bg-white/35 px-3.5 py-2 text-xs font-semibold text-primary shadow-sm backdrop-blur-md active:scale-[0.98] sm:min-h-0 sm:border-transparent sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm sm:font-medium sm:shadow-none sm:backdrop-blur-none sm:hover:underline"
        >
          Set budgets
        </Link>
      </div>

      <section
        className="sm:hidden rounded-[1.75rem] border border-white/55 bg-white/45 p-5 shadow-glass backdrop-blur-2xl"
        aria-label="Balance overview"
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">Total balance</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
          {formatCurrency(lifetimeNet, currency)}
        </p>
        <p className="mt-2 text-xs text-neutral-600">
          This month ·{' '}
          <span className="font-semibold tabular-nums text-neutral-800">{formatCurrency(monthNet, currency)}</span>
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            href="/dashboard/income"
            className="rounded-2xl border border-white/55 bg-white/35 py-3 text-center text-sm font-semibold text-neutral-800 shadow-sm backdrop-blur-md active:scale-[0.98]"
          >
            Income
          </Link>
          <Link
            href="/dashboard/expenses"
            className="rounded-2xl border border-white/55 bg-white/35 py-3 text-center text-sm font-semibold text-neutral-800 shadow-sm backdrop-blur-md active:scale-[0.98]"
          >
            Expense
          </Link>
        </div>
      </section>

      <div
        role="region"
        aria-label="Summary statistics"
        className="flex max-sm:-mx-3 max-sm:snap-x max-sm:snap-mandatory max-sm:gap-3 max-sm:overflow-x-auto max-sm:px-3 max-sm:pb-1 max-sm:[-ms-overflow-style:none] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:h-0 max-sm:[&::-webkit-scrollbar]:w-0 max-sm:touch-pan-x sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:touch-auto lg:grid-cols-4"
      >
        <div className="max-sm:w-[min(78vw,17.5rem)] max-sm:max-w-[280px] max-sm:shrink-0 max-sm:snap-start sm:w-auto sm:max-w-none">
          <SummaryCard
            title="Net (all time)"
            value={summaryData.balance.value}
            change={summaryData.balance.change}
            changeType={summaryData.balance.changeType}
            icon={Wallet}
            iconColor="primary"
          />
        </div>
        <div className="max-sm:w-[min(78vw,17.5rem)] max-sm:max-w-[280px] max-sm:shrink-0 max-sm:snap-start sm:w-auto sm:max-w-none">
          <SummaryCard
            title="Income"
            value={summaryData.income.value}
            change={summaryData.income.change}
            changeType={summaryData.income.changeType}
            icon={TrendingUp}
            iconColor="success"
          />
        </div>
        <div className="max-sm:w-[min(78vw,17.5rem)] max-sm:max-w-[280px] max-sm:shrink-0 max-sm:snap-start sm:w-auto sm:max-w-none">
          <SummaryCard
            title="Expenses"
            value={summaryData.expense.value}
            change={summaryData.expense.change}
            changeType={summaryData.expense.changeType}
            icon={TrendingDown}
            iconColor="danger"
          />
        </div>
        <div className="max-sm:w-[min(78vw,17.5rem)] max-sm:max-w-[280px] max-sm:shrink-0 max-sm:snap-start sm:w-auto sm:max-w-none">
          <SummaryCard
            title="Net (this month)"
            value={summaryData.savings.value}
            change={summaryData.savings.change}
            changeType={summaryData.savings.changeType}
            icon={Target}
            iconColor="success"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <ExpenseDonutChart data={expenseData} />
        <DailyTrendChart data={dailyTrendData} />
      </div>

      <BudgetStatus budgets={budgetRows} currency={currency} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <TodayEvents />
        <TodayReminders />
        <QuickNotes />
      </div>

      <RecentActivity activities={recentActivities} />
    </div>
  )
}

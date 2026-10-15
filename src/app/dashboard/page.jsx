'use client'

import { useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown, Percent } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import DailyQuoteCard from '../../components/dashboard/DailyQuoteCard'
import SummaryCard from '../../components/dashboard/SummaryCard'
import TodayEvents from '../../components/dashboard/TodayEvents'
import TasksCard from '../../components/dashboard/TasksCard'
import QuickNotes from '../../components/dashboard/QuickNotes'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'
import { usePrivacy } from '../../context/PrivacyContext'
import WalletCard from '../../components/dashboard/WalletCard'
import { useTheme } from '../../context/ThemeContext'
import { CATEGORICAL, chartMode, moneyColors } from '../../lib/chartColors'

const ExpenseDonutChart = dynamic(() => import('../../components/charts/ExpenseDonutChart'), {
  loading: () => <div className="glass-card animate-pulse" style={{ height: 300 }} />,
  ssr: false,
})
const DailyTrendChart = dynamic(() => import('../../components/charts/DailyTrendChart'), {
  loading: () => <div className="glass-card animate-pulse" style={{ height: 300 }} />,
  ssr: false,
})
const MonthlyTrendChart = dynamic(() => import('../../components/charts/MonthlyTrendChart'), {
  loading: () => <div className="glass-card animate-pulse" style={{ height: 300 }} />,
  ssr: false,
})
const InsightRings = dynamic(() => import('../../components/charts/InsightRings'), {
  loading: () => <div className="glass-card animate-pulse" style={{ height: 240 }} />,
  ssr: false,
})
const TopCategoriesChart = dynamic(() => import('../../components/charts/TopCategoriesChart'), {
  loading: () => <div className="glass-card animate-pulse" style={{ height: 240 }} />,
  ssr: false,
})
const BudgetBarChart = dynamic(() => import('../../components/charts/BudgetBarChart'), {
  loading: () => <div className="glass-card animate-pulse" style={{ height: 260 }} />,
  ssr: false,
})

function buildDailyTrend(ledgerMonthKey, transactions) {
  if (!ledgerMonthKey) return []
  const [y, m] = ledgerMonthKey.split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return []
  const daysInMonth = new Date(y, m, 0).getDate()
  const rows = Array.from({ length: daysInMonth }, (_, i) => ({ date: String(i + 1), income: 0, expense: 0 }))
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

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function shiftMonthKey(monthKey, delta) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Income/expense totals for `count` months ending at (and including) monthKey. */
function buildMonthlyTrend(monthKey, transactions, count = 6) {
  if (!/^\d{4}-\d{2}$/.test(monthKey || '')) return []
  const keys = Array.from({ length: count }, (_, i) => shiftMonthKey(monthKey, i - count + 1))
  const rows = new Map(keys.map((k) => {
    const [y, m] = k.split('-').map(Number)
    return [k, { key: k, label: MONTH_SHORT[m - 1], fullLabel: `${MONTH_SHORT[m - 1]} ${y}`, income: 0, expense: 0 }]
  }))
  transactions.forEach((t) => {
    const row = rows.get(String(t.date || '').slice(0, 7))
    if (!row) return
    const n = Number(t.amount || 0)
    if (t.type === 'income') row.income += n
    else if (t.type === 'expense') row.expense += n
  })
  return [...rows.values()]
}

function cumulative(values) {
  let run = 0
  return values.map((v) => (run += v))
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const {
    currency, ledgerMonthKey, transactionsInLedgerMonth,
    monthIncome, monthExpense, monthNet, totalBalance, accountBalances,
    expenseByCategory, budgetRowsFull, transactions,
  } = useFinance()
  const { revealed } = usePrivacy()
  const { theme } = useTheme()
  const money = moneyColors(theme)
  const palette = CATEGORICAL[chartMode(theme)]
  const statsRef = useRef(null)
  const chartsRef = useRef(null)

  useEffect(() => {
    if (!user || loading) return
    import('gsap').then(({ gsap: g }) => {
      const tl = g.timeline({ defaults: { ease: 'power3.out' } })
      if (statsRef.current?.children) {
        tl.fromTo(Array.from(statsRef.current.children), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 })
      }
      if (chartsRef.current?.children) {
        tl.fromTo(Array.from(chartsRef.current.children), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1 }, '-=0.2')
      }
    }).catch(() => {})
  }, [user, loading])

  const expenseData = useMemo(() =>
    Object.entries(expenseByCategory).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value })),
    [expenseByCategory]
  )
  const dailyTrendData = useMemo(() => buildDailyTrend(ledgerMonthKey, transactions), [ledgerMonthKey, transactions])
  const recentActivities = useMemo(() =>
    transactionsInLedgerMonth
      .filter((t) => t.type === 'income' || t.type === 'expense')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)
      .map((t) => ({
        id: t.id, type: t.type,
        title: t.description || t.category || 'Transaction',
        amount: t.type === 'income' ? Number(t.amount || 0) : -Number(t.amount || 0),
        category: t.category, time: t.date,
      })),
    [transactionsInLedgerMonth]
  )

  const monthlyTrend = useMemo(() => buildMonthlyTrend(ledgerMonthKey, transactions), [ledgerMonthKey, transactions])

  // Cumulative running totals give each summary card a "how the month built up" line.
  const sparks = useMemo(() => ({
    income: cumulative(dailyTrendData.map((d) => d.income)),
    expense: cumulative(dailyTrendData.map((d) => d.expense)),
    net: cumulative(dailyTrendData.map((d) => d.income - d.expense)),
    savings: monthlyTrend.map((m) => (m.income > 0 ? Math.max(0, (m.income - m.expense) / m.income) : 0)),
  }), [dailyTrendData, monthlyTrend])

  const topCategoryRows = useMemo(() => {
    if (!ledgerMonthKey) return []
    const prevKey = shiftMonthKey(ledgerMonthKey, -1)
    const prev = new Map()
    transactions.forEach((t) => {
      if (t.type !== 'expense' || String(t.date || '').slice(0, 7) !== prevKey) return
      const c = t.category || 'Other'
      prev.set(c, (prev.get(c) || 0) + Number(t.amount || 0))
    })
    return expenseData.map((r) => ({ ...r, prev: prev.get(r.name) || 0 }))
  }, [expenseData, transactions, ledgerMonthKey])

  const monthClock = useMemo(() => {
    const [y, m] = (ledgerMonthKey || '').split('-').map(Number)
    const days = new Date(y, m, 0).getDate() || 30
    const now = new Date()
    const nowKey = now.getFullYear() * 12 + now.getMonth()
    const viewKey = y * 12 + (m - 1)
    if (viewKey < nowKey) return { progress: 100, label: 'Complete' }
    if (viewKey > nowKey) return { progress: 0, label: 'Not started' }
    return { progress: (now.getDate() / days) * 100, label: `Day ${now.getDate()} of ${days}` }
  }, [ledgerMonthKey])

  const savingsRate = monthIncome > 0 ? Math.round((monthNet / monthIncome) * 100) : 0
  // Only spending in categories that have a budget counts against it.
  const budgeted = budgetRowsFull.filter((r) => Number(r.budget) > 0)
  const totalBudget = budgeted.reduce((s, r) => s + Number(r.budget), 0)
  const budgetUsed = totalBudget > 0 ? (budgeted.reduce((s, r) => s + Number(r.spent || 0), 0) / totalBudget) * 100 : 0

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-2xl animate-pulse" style={{ background: 'var(--accent)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>Loading…</p>
        </div>
      </div>
    )
  }
  if (!user) return null

  const budgetChartRows = budgetRowsFull.filter((r) => r.budget > 0 || r.spent > 0)

  return (
    <div className="space-y-5 sm:space-y-6">

      <DailyQuoteCard />

      {/* Row 1 — Hero + Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">

        {/* Wallet Balance Card */}
        <div className="lg:col-span-1">
          <WalletCard
            accountBalances={accountBalances}
            totalBalance={totalBalance}
            currency={currency}
            formatCurrency={formatCurrency}
            monthNet={monthNet}
            monthIncome={monthIncome}
          />
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 content-start">
          <SummaryCard title="Monthly Income" value={formatCurrency(monthIncome, currency)}
            change="This month" changeType="neutral" icon={TrendingUp}
            spark={sparks.income} sparkColor={money.income} />
          <SummaryCard title="Monthly Expense" value={formatCurrency(monthExpense, currency)}
            change="This month" changeType="neutral" icon={TrendingDown}
            spark={sparks.expense} sparkColor={money.expense} />
          <SummaryCard title="Monthly Net" value={formatCurrency(monthNet, currency)}
            change={monthNet >= 0 ? 'Surplus' : 'Deficit'}
            changeType={monthNet >= 0 ? 'positive' : 'negative'} icon={Wallet}
            spark={sparks.net} sparkColor={palette[6]} />
          <SummaryCard title="Savings Rate" value={`${Math.max(0, savingsRate)}%`}
            change="of income"
            changeType={savingsRate >= 20 ? 'positive' : savingsRate < 0 ? 'negative' : 'neutral'}
            icon={Percent}
            spark={sparks.savings} sparkColor={palette[3]} />
        </div>
      </div>

      {/* Row 2 — Reminders / Events / Notes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        <TodayEvents />
        <TasksCard />
        <QuickNotes />
      </div>

      {/* Rows 3-4 — Charts. Their axes and tooltips print exact figures, so the
          wallet's eye blurs them too rather than leaving a hole in the guard. */}
      <div
        aria-hidden={!revealed}
        style={{
          filter: revealed ? 'none' : 'blur(9px)',
          pointerEvents: revealed ? 'auto' : 'none',
          transition: 'filter 0.3s ease',
        }}
        className="space-y-5 sm:space-y-6"
      >
        <div ref={chartsRef} className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
          <DailyTrendChart data={dailyTrendData} />
          <ExpenseDonutChart data={expenseData} />
          <MonthlyTrendChart data={monthlyTrend} currency={currency} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 lg:gap-5">
            <InsightRings
              savingsRate={savingsRate}
              budgetUsed={budgetUsed}
              totalBudget={totalBudget}
              monthProgress={monthClock.progress}
              dayLabel={monthClock.label}
            />
            <TopCategoriesChart rows={topCategoryRows} />
          </div>
        </div>

        {budgetChartRows.length > 0 && (
          <BudgetBarChart rows={budgetChartRows} currency={currency} />
        )}
      </div>

      {/* Row 5 — Recent Activity */}
      <RecentActivity activities={recentActivities} />
    </div>
  )
}

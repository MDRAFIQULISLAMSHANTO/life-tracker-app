'use client'

import { useMemo, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown, Percent, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import SummaryCard from '../../components/dashboard/SummaryCard'
import TodayEvents from '../../components/dashboard/TodayEvents'
import TodayReminders from '../../components/dashboard/TodayReminders'
import QuickNotes from '../../components/dashboard/QuickNotes'
import RecentActivity from '../../components/dashboard/RecentActivity'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { useDashboardToday } from '../../context/DashboardTodayContext'
import { useReminderNotifications } from '../../hooks/useReminderNotifications'

const ExpenseDonutChart = dynamic(() => import('../../components/charts/ExpenseDonutChart'), {
  loading: () => <div className="glass-card animate-pulse" style={{ height: 300 }} />,
  ssr: false,
})
const DailyTrendChart = dynamic(() => import('../../components/charts/DailyTrendChart'), {
  loading: () => <div className="glass-card animate-pulse" style={{ height: 300 }} />,
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

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { openQuickAdd } = useQuickAdd()
  const {
    currency, ledgerMonthKey, transactionsInLedgerMonth,
    monthIncome, monthExpense, monthNet, lifetimeNet,
    expenseByCategory, budgetRowsFull, transactions,
  } = useFinance()
  const { reminders } = useDashboardToday()
  useReminderNotifications(reminders)

  const [balanceVisible, setBalanceVisible] = useState(false)

  const heroRef = useRef(null)
  const statsRef = useRef(null)
  const chartsRef = useRef(null)

  useEffect(() => {
    if (!user || loading) return
    import('gsap').then(({ gsap: g }) => {
      const tl = g.timeline({ defaults: { ease: 'power3.out' } })
      if (heroRef.current) tl.fromTo(heroRef.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 })
      if (statsRef.current?.children) {
        tl.fromTo(Array.from(statsRef.current.children), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.08 }, '-=0.3')
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
      .slice(0, 15)
      .map((t) => ({
        id: t.id, type: t.type,
        title: t.description || t.category || 'Transaction',
        amount: t.type === 'income' ? Number(t.amount || 0) : -Number(t.amount || 0),
        category: t.category, time: t.date,
      })),
    [transactionsInLedgerMonth]
  )

  const savingsRate = monthIncome > 0 ? Math.round((monthNet / monthIncome) * 100) : 0

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

      {/* Row 1 — Hero + Stats */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">

        {/* Hero Balance Card */}
        <div ref={heroRef} className="lg:col-span-1">
          <div
            className="hero-card relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 55%, #000 45%))',
              borderRadius: '1.5rem',
              padding: '1.5rem',
              minHeight: 200,
            }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full opacity-10" style={{ background: 'rgba(255,255,255,0.3)' }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-bold uppercase tracking-widest text-white/70">Total Balance</p>
                <button
                  type="button"
                  onClick={() => setBalanceVisible((v) => !v)}
                  className="flex items-center justify-center w-7 h-7 rounded-lg transition-opacity hover:opacity-70 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                  aria-label={balanceVisible ? 'Hide balance' : 'Show balance'}
                >
                  {balanceVisible
                    ? <EyeOff className="w-3.5 h-3.5 text-white/80" />
                    : <Eye className="w-3.5 h-3.5 text-white/80" />
                  }
                </button>
              </div>

              {balanceVisible ? (
                <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight mb-1">
                  {formatCurrency(lifetimeNet, currency)}
                </p>
              ) : (
                <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-1 select-none">
                  ••••••
                </p>
              )}
              <p className="text-xs text-white/60 mb-6">{ledgerMonthKey} · tap eye to reveal</p>

              <div className="grid grid-cols-2 gap-2">
                <Link href="/dashboard/income"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)' }}>
                  <ArrowDownRight className="w-4 h-4" /> Income
                </Link>
                <Link href="/dashboard/expenses"
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all active:scale-95"
                  style={{ background: 'rgba(0,0,0,0.25)' }}>
                  <ArrowUpRight className="w-4 h-4" /> Expense
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 content-start">
          <SummaryCard title="Monthly Income" value={formatCurrency(monthIncome, currency)}
            change="This month" changeType="neutral" icon={TrendingUp} iconColor="success" />
          <SummaryCard title="Monthly Expense" value={formatCurrency(monthExpense, currency)}
            change="This month" changeType="neutral" icon={TrendingDown} iconColor="danger" />
          <SummaryCard title="Monthly Net" value={formatCurrency(monthNet, currency)}
            change={monthNet >= 0 ? 'Surplus' : 'Deficit'}
            changeType={monthNet >= 0 ? 'positive' : 'negative'} icon={Wallet} iconColor="primary" />
          <SummaryCard title="Savings Rate" value={`${Math.max(0, savingsRate)}%`}
            change="of income"
            changeType={savingsRate >= 20 ? 'positive' : savingsRate < 0 ? 'negative' : 'neutral'}
            icon={Percent} iconColor={savingsRate >= 20 ? 'success' : 'warning'} />
        </div>
      </div>

      {/* Row 2 — Reminders / Events / Notes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        <TodayEvents />
        <TodayReminders />
        <QuickNotes />
      </div>

      {/* Row 3 — Charts */}
      <div ref={chartsRef} className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <DailyTrendChart data={dailyTrendData} />
        <ExpenseDonutChart data={expenseData} />
      </div>

      {/* Row 4 — Budget vs Actual (all categories) */}
      {budgetChartRows.length > 0 && (
        <BudgetBarChart rows={budgetChartRows} currency={currency} />
      )}

      {/* Row 5 — Recent Activity */}
      <RecentActivity activities={recentActivities} />
    </div>
  )
}

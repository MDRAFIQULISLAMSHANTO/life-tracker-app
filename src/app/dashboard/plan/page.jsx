'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Copy, Moon } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useGrowth } from '../../../context/GrowthContext'
import { formatDayLabel, todayKey, tomorrowKey } from '../../../lib/growthMath'
import { Button, Card, PageHeader, SegmentedControl } from '../../../components/ui'
import { DailyPlanForm, DailyReviewForm } from '../../../components/growth/DayBits'

export default function PlanPage() {
  const { user, loading } = useAuth()
  const { dailyPlan, setDailyPlan } = useGrowth()
  const [target, setTarget] = useState('tomorrow')

  const today = todayKey()
  const tomorrow = tomorrowKey()
  const dateKey = target === 'today' ? today : tomorrow
  const todayPlan = dailyPlan[today] || {}

  const copyToday = () => {
    const src = dailyPlan[today]
    if (!src) return
    setDailyPlan(tomorrow, {
      top3: (src.top3 || []).map((t) =>
        typeof t === 'string' ? { text: t, done: false } : { ...t, done: false }
      ),
      focusBehavior: src.focusBehavior || '',
      firstAction: src.firstAction || '',
      energyWindow: src.energyWindow || '',
      sayNoTo: src.sayNoTo || '',
    })
  }

  if (loading || !user) return null

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Daily plan"
        subtitle={formatDayLabel(dateKey)}
        icon={Moon}
        actions={
          <>
            <SegmentedControl
              size="sm"
              value={target}
              onChange={setTarget}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'tomorrow', label: 'Tomorrow' },
              ]}
            />
            {target === 'tomorrow' && todayPlan.top3?.length > 0 && (
              <Button variant="secondary" size="sm" onClick={copyToday}>
                <Copy className="h-4 w-4" />
                Copy today
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <DailyPlanForm dateKey={dateKey} />
        <div className="flex flex-col gap-4">
          <DailyReviewForm dateKey={today} />

          <Card className="flex flex-col gap-2">
            <h2 className="text-sm font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              Why this works
            </h2>
            <ul className="flex flex-col gap-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
              <li>
                <strong style={{ color: 'var(--text-1)' }}>Night brain plans better than morning brain</strong> —
                decisions made tonight save willpower tomorrow.
              </li>
              <li>
                <strong style={{ color: 'var(--text-1)' }}>Three priorities, not ten</strong> — anything more is a
                wishlist.
              </li>
              <li>
                <strong style={{ color: 'var(--text-1)' }}>First action defined</strong> — kills morning paralysis.
              </li>
              <li>
                <strong style={{ color: 'var(--text-1)' }}>The no-list matters as much as the to-do list</strong> —
                it guards against people pleasing.
              </li>
            </ul>
            <Link
              href="/dashboard/growth/fix-behavior"
              className="mt-1 text-xs font-bold"
              style={{ color: 'var(--accent)' }}
            >
              The 5 behaviours →
            </Link>
          </Card>

          <Card className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                Today’s habits
              </p>
            </div>
            <Link href="/dashboard/growth">
              <Button variant="secondary" size="sm">
                Open Growth
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}

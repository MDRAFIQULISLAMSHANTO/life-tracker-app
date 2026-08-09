'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Flame,
  Moon,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useContent } from '../../../context/ContentContext'
import { useGrowth } from '../../../context/GrowthContext'
import { isOwner } from '../../../lib/owner'
import {
  currentStreak,
  dayCompletion,
  formatDayLabel,
  isHabitDue,
  todayKey,
} from '../../../lib/growthMath'
import { Button, Card, EmptyState, PageHeader, ProgressRing, StatTile } from '../../../components/ui'
import { HabitFormSheet, HabitRow } from '../../../components/growth/HabitBits'
import {
  DailyReviewForm,
  RoutineBlocks,
  TriggerLogList,
  TriggerLogSheet,
  WeeklyReviewSheet,
} from '../../../components/growth/DayBits'

export default function GrowthPage() {
  const { user, loading } = useAuth()
  const { activeHabits, habitLog, goals, seededWith } = useGrowth()
  // Study pages are shared content, not per-user data — everyone reads the same
  // live copy, so an edit reaches every account without a re-seed or a reload.
  const { pageGroups: referenceGroups } = useContent()
  const [editingHabit, setEditingHabit] = useState(null)
  const [habitSheet, setHabitSheet] = useState(false)
  const [triggerSheet, setTriggerSheet] = useState(false)
  const [weeklySheet, setWeeklySheet] = useState(false)

  const today = todayKey()
  const completion = useMemo(() => dayCompletion(activeHabits, habitLog, today), [activeHabits, habitLog, today])
  const dueToday = useMemo(() => activeHabits.filter((h) => isHabitDue(h, today)), [activeHabits, today])

  const bestStreak = useMemo(() => {
    let best = { name: '', streak: 0 }
    activeHabits.forEach((h) => {
      const { streak } = currentStreak(h, habitLog, today)
      if (streak > best.streak) best = { name: h.name, streak }
    })
    return best
  }, [activeHabits, habitLog, today])

  const activeGoals = goals.filter((g) => g.status !== 'done' && !g.parentGoalId)

  if (loading) return null
  if (!user) return null

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Growth"
        subtitle={formatDayLabel(today)}
        icon={Sparkles}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setTriggerSheet(true)}>
              <ClipboardList className="h-4 w-4" />
              Log trigger
            </Button>
            <Button size="sm" onClick={() => setWeeklySheet(true)}>
              <CalendarCheck className="h-4 w-4" />
              Weekly review
            </Button>
          </>
        }
      />

      {/* Today at a glance */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="flex items-center gap-4">
          <ProgressRing value={completion.pct} size={72} stroke={7} sublabel="today" />
          <div className="min-w-0">
            <p className="text-sm font-extrabold" style={{ color: 'var(--text-1)' }}>
              {completion.done} of {completion.total} habits
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
              {completion.pct === 100
                ? 'Everything ticked. That’s the whole game.'
                : '5 minutes beats zero — do the minimum and move on.'}
            </p>
            <Link
              href="/dashboard/habits"
              className="mt-2 inline-block text-xs font-bold"
              style={{ color: 'var(--accent)' }}
            >
              Manage habits →
            </Link>
          </div>
        </Card>

        <StatTile
          label="Best streak"
          value={bestStreak.streak ? `${bestStreak.streak} days` : '—'}
          hint={bestStreak.name || 'Tick something today to start one'}
          icon={Flame}
        />
        <StatTile
          label="Active goals"
          value={activeGoals.length}
          hint={activeGoals[0]?.title || 'No goals yet'}
          icon={Target}
        />
      </div>

      {/* Routine + habits */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <RoutineBlocks dateKey={today} />

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              Today’s habits
            </h2>
            <Link href="/dashboard/plan" className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
              Plan tomorrow →
            </Link>
          </div>
          {dueToday.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Nothing scheduled today. Enjoy the rest day.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {dueToday.map((h) => (
                <HabitRow key={h.id} habit={h} onEdit={setEditingHabit} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {activeHabits.length === 0 && (
        <EmptyState
          icon={Sparkles}
          title="No habits yet"
          description="Add the handful of things you want to do every day. Streaks build from there."
          action={<Button onClick={() => setHabitSheet(true)}>Add your first habit</Button>}
        />
      )}

      {/* Daily review */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
        <DailyReviewForm dateKey={today} />

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              Trigger log
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setTriggerSheet(true)}>
              Add
            </Button>
          </div>
          <TriggerLogList />
        </Card>
      </div>

      {/* Reference library */}
      {referenceGroups.length > 0 && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              The playbook
            </h2>
            {isOwner(user) && (
              <Link
                href="/dashboard/admin/library"
                className="ml-auto text-xs font-bold"
                style={{ color: 'var(--accent)' }}
              >
                Edit library →
              </Link>
            )}
          </div>
          {referenceGroups.map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
                {group}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/dashboard/growth/${r.slug}`}
                    className="flex items-center gap-3 rounded-2xl px-3.5 py-3 transition-transform active:scale-[0.98]"
                    style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
                  >
                    <span className="text-xl" aria-hidden>
                      {r.icon}
                    </span>
                    <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                      {r.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      {seededWith === 'owner-v1' && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              Career tracks
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
              Odoo, ERPNext, project management, documentation, soft skills, certifications.
            </p>
          </div>
          <Link href="/dashboard/goals">
            <Button variant="secondary" size="sm">
              <TrendingUp className="h-4 w-4" />
              Open goals
            </Button>
          </Link>
        </Card>
      )}

      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Moon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          <div>
            <p className="text-sm font-extrabold" style={{ color: 'var(--text-1)' }}>
              Plan tomorrow before you sleep
            </p>
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              Three priorities, one focus behaviour, one first action.
            </p>
          </div>
        </div>
        <Link href="/dashboard/plan">
          <Button size="sm">Open the ritual</Button>
        </Link>
      </Card>

      <HabitFormSheet
        key={editingHabit?.id || 'new'}
        open={habitSheet || !!editingHabit}
        habit={editingHabit}
        onClose={() => {
          setHabitSheet(false)
          setEditingHabit(null)
        }}
      />
      <TriggerLogSheet open={triggerSheet} onClose={() => setTriggerSheet(false)} />
      <WeeklyReviewSheet open={weeklySheet} onClose={() => setWeeklySheet(false)} />
    </div>
  )
}

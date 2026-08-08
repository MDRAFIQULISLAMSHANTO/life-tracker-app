'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Flame, Plus, Repeat } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useGrowth } from '../../../context/GrowthContext'
import {
  addDays,
  completionSeries,
  currentStreak,
  dayCompletion,
  formatDayLabel,
  longestStreak,
  todayKey,
} from '../../../lib/growthMath'
import { Button, Card, EmptyState, PageHeader, ProgressRing, StatTile } from '../../../components/ui'
import { HabitFormSheet, HabitGroups, HabitHeatmap } from '../../../components/growth/HabitBits'

export default function HabitsPage() {
  const { user, loading } = useAuth()
  const { activeHabits, habits, habitLog, updateHabit } = useGrowth()
  const [dateKey, setDateKey] = useState(todayKey())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  const completion = useMemo(() => dayCompletion(activeHabits, habitLog, dateKey), [activeHabits, habitLog, dateKey])
  const series = useMemo(() => completionSeries(activeHabits, habitLog, 84), [activeHabits, habitLog])
  const perfectDays = series.filter((d) => d.total > 0 && d.pct === 100).length
  const archived = habits.filter((h) => h.archived)

  const topStreaks = useMemo(
    () =>
      activeHabits
        .map((h) => ({ habit: h, ...currentStreak(h, habitLog), best: longestStreak(h, habitLog, 180) }))
        .sort((a, b) => b.streak - a.streak),
    [activeHabits, habitLog]
  )

  if (loading || !user) return null

  const isToday = dateKey === todayKey()

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Habits"
        subtitle="Tick the small things. Streaks do the rest."
        icon={Repeat}
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setSheetOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            New habit
          </Button>
        }
      />

      {/* Date stepper */}
      <Card className="flex items-center justify-between gap-3" style={{ padding: '0.75rem 1rem' }}>
        <button
          type="button"
          onClick={() => setDateKey((k) => addDays(k, -1))}
          aria-label="Previous day"
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-2)' }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-sm font-extrabold" style={{ color: 'var(--text-1)' }}>
            {isToday ? 'Today' : formatDayLabel(dateKey)}
          </p>
          <p className="text-xs tabular-nums" style={{ color: 'var(--text-3)' }}>
            {dateKey}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDateKey((k) => (k >= todayKey() ? k : addDays(k, 1)))}
          disabled={isToday}
          aria-label="Next day"
          className="flex h-9 w-9 items-center justify-center rounded-xl disabled:opacity-40"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-2)' }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </Card>

      {activeHabits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No habits yet"
          description="Start with three. Anything more on day one is a wishlist, not a system."
          action={
            <Button
              onClick={() => {
                setEditing(null)
                setSheetOpen(true)
              }}
            >
              Add a habit
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card className="col-span-2 flex items-center gap-4 lg:col-span-1">
              <ProgressRing value={completion.pct} size={64} stroke={6} />
              <div>
                <p className="text-sm font-extrabold" style={{ color: 'var(--text-1)' }}>
                  {completion.done}/{completion.total} done
                </p>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                  {isToday ? 'today' : formatDayLabel(dateKey)}
                </p>
              </div>
            </Card>
            <StatTile
              label="Longest active streak"
              value={topStreaks[0]?.streak ? `${topStreaks[0].streak}d` : '—'}
              hint={topStreaks[0]?.habit?.name || ''}
              icon={Flame}
            />
            <StatTile label="Perfect days" value={perfectDays} hint="last 12 weeks" icon={CheckCircle2} />
            <StatTile label="Tracking" value={activeHabits.length} hint="active habits" icon={Repeat} />
          </div>

          <HabitGroups
            habits={activeHabits}
            dateKey={dateKey}
            onEdit={(h) => {
              setEditing(h)
              setSheetOpen(true)
            }}
          />

          {/* Streak + heatmap table */}
          <Card className="flex flex-col gap-4">
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              Last 12 weeks
            </h2>
            <div className="flex flex-col gap-3">
              {topStreaks.map(({ habit, streak, best }) => (
                <div key={habit.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                      <span aria-hidden className="mr-1.5">
                        {habit.emoji}
                      </span>
                      {habit.name}
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: 'var(--text-3)' }}>
                      {streak}d now · {best}d best
                    </span>
                  </div>
                  <HabitHeatmap habit={habit} />
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {archived.length > 0 && (
        <Card className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            aria-expanded={showArchived}
            className="text-left text-sm font-bold"
            style={{ color: 'var(--text-2)' }}
          >
            Archived ({archived.length}) {showArchived ? '▴' : '▾'}
          </button>
          {showArchived &&
            archived.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: 'var(--text-2)' }}>
                  {h.emoji} {h.name}
                </span>
                <Button variant="secondary" size="sm" onClick={() => updateHabit(h.id, { archived: false })}>
                  Restore
                </Button>
              </div>
            ))}
        </Card>
      )}

      <HabitFormSheet
        key={editing?.id || 'new'}
        open={sheetOpen}
        habit={editing}
        onClose={() => {
          setSheetOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

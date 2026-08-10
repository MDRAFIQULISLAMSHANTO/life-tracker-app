'use client'

import { useMemo, useState } from 'react'
import { Plus, Target, TrendingUp } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useGrowth } from '../../../context/GrowthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency } from '../../../utils/formatters'
import { goalProgress } from '../../../lib/growthMath'
import { Button, Card, EmptyState, Field, PageHeader, ProgressBar, Select, StatTile } from '../../../components/ui'
import { GoalCard, GoalFormSheet, useFinanceLinkValue } from '../../../components/growth/GoalBits'

/** Bucket label for goals with no category set. */
const UNCATEGORISED = 'Uncategorised'

const TRACK_STATUSES = [
  { value: 'not-started', label: '⚪ Not started' },
  { value: 'in-progress', label: '🟡 In progress' },
  { value: 'done', label: '🟢 Done' },
]

export default function GoalsPage() {
  const { user, loading } = useAuth()
  const { goals, tracks, updateTrack, library, updateLibraryItem } = useGrowth()
  const { currency, lifetimeNet } = useFinance()
  const getFinanceValue = useFinanceLinkValue()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filter, setFilter] = useState('active')

  const rootGoals = useMemo(() => goals.filter((g) => !g.parentGoalId), [goals])
  const childrenOf = useMemo(() => {
    const map = new Map()
    goals.forEach((g) => {
      if (!g.parentGoalId) return
      if (!map.has(g.parentGoalId)) map.set(g.parentGoalId, [])
      map.get(g.parentGoalId).push(g)
    })
    return map
  }, [goals])

  const visible = rootGoals.filter((g) => (filter === 'all' ? true : (g.status || 'active') === filter))

  // Cluster by category the way habits cluster by group. Uncategorised goals
  // fall into one trailing bucket rather than vanishing.
  const visibleByCategory = useMemo(() => {
    const map = new Map()
    visible.forEach((g) => {
      const key = (g.category || '').trim() || UNCATEGORISED
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(g)
    })
    return [...map.entries()].sort(([a], [b]) => {
      if (a === UNCATEGORISED) return 1
      if (b === UNCATEGORISED) return -1
      return a.localeCompare(b)
    })
  }, [visible])

  const overall = useMemo(() => {
    if (!rootGoals.length) return 0
    const sum = rootGoals.reduce(
      (s, g) => s + goalProgress(g, { financeValue: getFinanceValue(g.financeLink) }).pct,
      0
    )
    return Math.round(sum / rootGoals.length)
  }, [rootGoals, getFinanceValue])

  if (loading || !user) return null

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Goals"
        subtitle="Targets with steps, dates and live progress."
        icon={Target}
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="h-4 w-4" />
            New goal
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Average progress" value={`${overall}%`} hint={`${rootGoals.length} goals`} icon={Target} />
        <StatTile
          label="Net saved"
          value={formatCurrency(lifetimeNet, currency)}
          hint="lifetime income − expenses"
          tone={lifetimeNet >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
        />
        <StatTile
          label="Steps done"
          value={goals.reduce((s, g) => s + (g.milestones || []).filter((m) => m.done).length, 0)}
          hint={`of ${goals.reduce((s, g) => s + (g.milestones || []).length, 0)}`}
        />
        <StatTile label="Completed" value={goals.filter((g) => g.status === 'done').length} hint="goals closed" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
          Your goals
        </h2>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter goals"
          style={{ width: 'auto', minHeight: 38 }}
        >
          <option value="active">Active</option>
          <option value="done">Completed</option>
          <option value="all">All</option>
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals here yet"
          description="A goal is a target plus the steps to get there. Add one and break it into milestones."
          action={<Button onClick={() => setSheetOpen(true)}>Add a goal</Button>}
        />
      ) : (
        <div className="space-y-5">
          {visibleByCategory.map(([category, items]) => (
            <div key={category}>
              <div className="mb-2 flex items-baseline gap-2">
                <h3
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text-3)' }}
                >
                  {category}
                </h3>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-3)' }}>
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {items.map((g) => (
                  <GoalCard key={g.id} goal={g} subGoals={childrenOf.get(g.id) || []} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tracks.length > 0 && (
        <Card className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              Learning tracks
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
              Update these once a week — five minutes at the end of a work session is enough.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {tracks.map((t) => (
              <div key={t.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                    {t.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Select
                      value={t.status}
                      onChange={(e) => updateTrack(t.id, { status: e.target.value })}
                      aria-label={`${t.name} status`}
                      style={{ width: 'auto', minHeight: 34, fontSize: 16 }}
                    >
                      {TRACK_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Select>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={t.percent || 0}
                      onChange={(e) => updateTrack(t.id, { percent: Number(e.target.value) })}
                      aria-label={`${t.name} percent complete`}
                      style={{ width: 96 }}
                    />
                    <span className="w-9 text-right text-xs font-bold tabular-nums" style={{ color: 'var(--text-2)' }}>
                      {t.percent || 0}%
                    </span>
                  </div>
                </div>
                <ProgressBar value={t.percent || 0} height={6} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {library.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
            Reading list
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {library.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
              >
                <input
                  type="checkbox"
                  checked={b.status === 'done'}
                  onChange={(e) => updateLibraryItem(b.id, { status: e.target.checked ? 'done' : 'todo' })}
                  aria-label={`Mark ${b.title} as read`}
                  className="h-4 w-4 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm font-bold"
                    style={{
                      color: 'var(--text-1)',
                      textDecoration: b.status === 'done' ? 'line-through' : 'none',
                    }}
                  >
                    {b.title}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'var(--text-3)' }}>
                    {b.author} · {b.topic}
                  </p>
                </div>
                {b.url && (
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs font-bold"
                    style={{ color: 'var(--accent)' }}
                  >
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      <GoalFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}

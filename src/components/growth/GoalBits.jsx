'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Check, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useGrowth } from '../../context/GrowthContext'
import { useFinance } from '../../context/FinanceContext'
import { goalPacing, goalProgress, todayKey } from '../../lib/growthMath'
import { formatCurrency } from '../../utils/formatters'
import { Badge, Button, Card, Field, Input, ProgressBar, ProgressRing, Select, Sheet, Textarea } from '../ui'

/**
 * Goals can read their current value straight from the ledger instead of
 * asking the user to retype numbers they already tracked.
 */
export function useFinanceLinkValue() {
  const { transactions, lifetimeNet } = useFinance()
  return useMemo(() => {
    const lifetimeIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount || 0), 0)
    return (link) => {
      if (link === 'lifetimeIncome') return lifetimeIncome
      if (link === 'lifetimeNet') return lifetimeNet
      return undefined
    }
  }, [transactions, lifetimeNet])
}

export function MilestoneList({ goal }) {
  const { toggleMilestone, addMilestone, deleteMilestone } = useGrowth()
  const [adding, setAdding] = useState('')
  const milestones = goal.milestones || []

  return (
    <div className="flex flex-col gap-1.5">
      {milestones.map((m) => (
        <div key={m.id} className="group flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => toggleMilestone(goal.id, m.id)}
            aria-pressed={!!m.done}
            aria-label={`${m.done ? 'Undo' : 'Complete'}: ${m.title}`}
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-transform active:scale-90"
            style={{
              background: m.done ? 'var(--success)' : 'transparent',
              border: `1.5px solid ${m.done ? 'var(--success)' : 'var(--card-border)'}`,
            }}
          >
            {m.done && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
          </button>
          <span
            className="flex-1 text-sm leading-snug"
            style={{
              color: m.done ? 'var(--text-3)' : 'var(--text-2)',
              textDecoration: m.done ? 'line-through' : 'none',
            }}
          >
            {m.title}
          </span>
          <button
            type="button"
            onClick={() => deleteMilestone(goal.id, m.id)}
            aria-label={`Delete milestone ${m.title}`}
            className="shrink-0 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
            style={{ color: 'var(--text-3)' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}

      <form
        className="mt-1 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!adding.trim()) return
          addMilestone(goal.id, adding)
          setAdding('')
        }}
      >
        <Input
          value={adding}
          onChange={(e) => setAdding(e.target.value)}
          placeholder="Add a step…"
          style={{ minHeight: 38, fontSize: 16 }}
        />
        <Button type="submit" variant="secondary" size="sm" aria-label="Add milestone">
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

export function GoalCard({ goal, subGoals = [], defaultOpen = false }) {
  const { currency } = useFinance()
  const getFinanceValue = useFinanceLinkValue()
  const [open, setOpen] = useState(defaultOpen)

  const progress = goalProgress(goal, { financeValue: getFinanceValue(goal.financeLink) })
  const pacing = goalPacing(goal, progress)

  const valueLabel =
    goal.kind === 'milestone'
      ? `${progress.current}/${progress.target} steps`
      : goal.unit === '৳' || goal.financeLink
        ? `${formatCurrency(progress.current, currency)} of ${formatCurrency(progress.target, currency)}`
        : `${progress.current} / ${progress.target} ${goal.unit || ''}`.trim()

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <ProgressRing value={progress.pct} size={56} stroke={5} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              {goal.title}
            </h3>
            {goal.category && <Badge>{goal.category}</Badge>}
            {goal.financeLink && <Badge color="var(--success)">auto from ledger</Badge>}
          </div>
          <p className="mt-1 text-xs font-semibold tabular-nums" style={{ color: 'var(--text-2)' }}>
            {valueLabel}
          </p>
          {goal.why && (
            <p className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
              {goal.why}
            </p>
          )}
        </div>
      </div>

      <ProgressBar value={progress.pct} />

      <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-3)' }}>
        {pacing && (
          <span className="font-semibold">
            {pacing.overdue
              ? 'Past due date'
              : `${pacing.daysLeft} days left${
                  goal.kind !== 'milestone' && pacing.perMonth > 0
                    ? ` · ${goal.financeLink || goal.unit === '৳' ? formatCurrency(pacing.perMonth, currency) : pacing.perMonth}/month to stay on track`
                    : ''
                }`}
          </span>
        )}
        {goal.referenceSlug && (
          <Link
            href={`/dashboard/growth/${goal.referenceSlug}`}
            className="inline-flex items-center gap-1 font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            The plan
          </Link>
        )}
      </div>

      {(goal.milestones?.length > 0 || subGoals.length > 0) && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-xs font-bold"
          style={{ color: 'var(--accent)' }}
        >
          <ChevronDown
            className="h-4 w-4 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          />
          {open ? 'Hide steps' : `Show steps${subGoals.length ? ' & tracks' : ''}`}
        </button>
      )}

      {open && (
        <div className="flex flex-col gap-4 border-t pt-3" style={{ borderColor: 'var(--card-border)' }}>
          <MilestoneList goal={goal} />
          {subGoals.map((sg) => (
            <GoalCard key={sg.id} goal={sg} />
          ))}
        </div>
      )}
    </Card>
  )
}

const KINDS = [
  { value: 'milestone', label: 'Checklist of steps' },
  { value: 'numeric', label: 'A number to reach' },
]

export function GoalFormSheet({ open, onClose, goal }) {
  const { upsertGoal, deleteGoal } = useGrowth()
  const editing = !!goal

  const [title, setTitle] = useState(goal?.title || '')
  const [why, setWhy] = useState(goal?.why || '')
  const [kind, setKind] = useState(goal?.kind || 'milestone')
  const [target, setTarget] = useState(String(goal?.target || ''))
  const [current, setCurrent] = useState(String(goal?.current || ''))
  const [unit, setUnit] = useState(goal?.unit || '')
  const [dueDate, setDueDate] = useState(goal?.dueDate || '')
  const [category, setCategory] = useState(goal?.category || '')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const res = upsertGoal({
      id: goal?.id,
      title,
      why,
      kind,
      target: Number(target) || 0,
      current: Number(current) || 0,
      unit,
      dueDate,
      category,
      startDate: goal?.startDate || todayKey(),
      status: goal?.status || 'active',
      milestones: goal?.milestones || [],
      linkedHabitIds: goal?.linkedHabitIds || [],
      financeLink: goal?.financeLink,
      parentGoalId: goal?.parentGoalId,
      referenceSlug: goal?.referenceSlug,
    })
    if (!res.ok) {
      setError(res.error || 'Could not save.')
      return
    }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit goal' : 'New goal'}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Goal">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Save ৳2,00,000" required />
        </Field>
        <Field label="Why it matters" hint="The reason you'll read on a bad day">
          <Textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} />
        </Field>
        <Field label="Type">
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>

        {kind === 'numeric' && (
          <div className="grid grid-cols-3 gap-3">
            <Field label="Target">
              <Input type="number" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} />
            </Field>
            <Field label="Now">
              <Input
                type="number"
                inputMode="decimal"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                disabled={!!goal?.financeLink}
              />
            </Field>
            <Field label="Unit">
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="৳" />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Category">
            <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Career" />
          </Field>
        </div>

        {error && (
          <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <Button type="submit" size="lg" full>
          {editing ? 'Save goal' : 'Add goal'}
        </Button>

        {editing && (
          <Button
            variant="danger"
            full
            onClick={() => {
              deleteGoal(goal.id)
              onClose()
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete goal
          </Button>
        )}
      </form>
    </Sheet>
  )
}

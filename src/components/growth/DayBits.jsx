'use client'

import { useEffect, useState } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { useGrowth } from '../../context/GrowthContext'
import { BEHAVIORS } from '../../lib/growthSeed'
import { blocksForMode, isoWeekKey, routineMinutes, todayKey, weeklyFocusFor } from '../../lib/growthMath'
import { Button, Card, Field, Input, SegmentedControl, Select, Sheet, Textarea } from '../ui'

/** Today's routine, filtered to the chosen mode. */
export function RoutineBlocks({ dateKey = todayKey() }) {
  const { routine, dailyPlan, toggleRoutineBlock, setRoutineMode, toggleHabit, habits, habitLog } = useGrowth()
  if (!routine) return null

  const plan = dailyPlan[dateKey] || {}
  const mode = plan.mode || routine.modes?.[0]?.id || 'full'
  const blocks = blocksForMode(routine, mode)
  const blocksDone = plan.blocksDone || {}
  const doneCount = blocks.filter((b) => blocksDone[b.id]).length
  const focus = weeklyFocusFor(routine, dateKey)

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
            {routine.name}
          </h2>
          <p className="mt-0.5 text-xs font-semibold" style={{ color: 'var(--text-2)' }}>
            {doneCount}/{blocks.length} blocks · {routineMinutes(blocks)} min
          </p>
        </div>
        {routine.modes?.length > 1 && (
          <SegmentedControl
            size="sm"
            value={mode}
            onChange={(m) => setRoutineMode(dateKey, m)}
            options={routine.modes.map((m) => ({ value: m.id, label: `${m.label} · ${m.minutes}m` }))}
          />
        )}
      </div>

      {focus && (
        <div
          className="rounded-2xl px-3.5 py-2.5 text-sm font-semibold"
          style={{ background: 'rgba(var(--accent-rgb),0.09)', color: 'var(--accent)' }}
        >
          Today’s focus — {focus}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {blocks.map((b) => {
          const done = !!blocksDone[b.id]
          return (
            <button
              key={b.id}
              type="button"
              aria-pressed={done}
              onClick={() => {
                toggleRoutineBlock(dateKey, b.id)
                // Blocks that map to a habit keep the streak in sync
                if (b.habitId) {
                  const habit = habits.find((h) => h.id === b.habitId)
                  const alreadyDone = !!habitLog?.[dateKey]?.[b.habitId]?.done
                  if (habit && done === alreadyDone) toggleHabit(habit, dateKey)
                }
              }}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors"
              style={{
                background: done ? 'rgba(34,197,94,0.08)' : 'var(--input-bg)',
                border: `1px solid ${done ? 'rgba(34,197,94,0.22)' : 'var(--card-border)'}`,
              }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: done ? 'var(--success)' : 'transparent',
                  border: `1.5px solid ${done ? 'var(--success)' : 'var(--card-border)'}`,
                }}
              >
                {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
              </span>
              <span
                className="flex-1 text-sm font-bold"
                style={{
                  color: 'var(--text-1)',
                  textDecoration: done ? 'line-through' : 'none',
                  textDecorationColor: 'var(--text-3)',
                }}
              >
                {b.title}
              </span>
              <span className="shrink-0 text-xs font-bold tabular-nums" style={{ color: 'var(--text-3)' }}>
                {b.minutes}m
              </span>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/** Next Day Plan ritual — Top 3, focus behaviour, first action, energy, say-no. */
export function DailyPlanForm({ dateKey }) {
  const { dailyPlan, setDailyPlan, planDefaults } = useGrowth()
  const plan = dailyPlan[dateKey] || {}

  const top3 = plan.top3 || planDefaults.top3 || ['', '', '']

  const setTop = (i, patch) => {
    const next = [0, 1, 2].map((idx) => {
      const item = typeof top3[idx] === 'string' ? { text: top3[idx], done: false } : top3[idx] || { text: '', done: false }
      return idx === i ? { ...item, ...patch } : item
    })
    setDailyPlan(dateKey, { top3: next })
  }

  const item = (i) => {
    const raw = top3[i]
    return typeof raw === 'string' ? { text: raw, done: false } : raw || { text: '', done: false }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
          Tomorrow’s plan
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
          Night brain plans better than morning brain. 5 minutes, three priorities.
        </p>
      </div>

      <Field label="Top 3 — non-negotiable">
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => {
            const it = item(i)
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTop(i, { done: !it.done })}
                  aria-pressed={!!it.done}
                  aria-label={`Mark priority ${i + 1} done`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    background: it.done ? 'var(--success)' : 'transparent',
                    border: `1.5px solid ${it.done ? 'var(--success)' : 'var(--card-border)'}`,
                  }}
                >
                  {it.done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3.5} />}
                </button>
                <Input
                  value={it.text}
                  onChange={(e) => setTop(i, { text: e.target.value })}
                  placeholder={['Morning practice', 'Work on project', 'Learn English'][i]}
                  style={{
                    textDecoration: it.done ? 'line-through' : 'none',
                    color: it.done ? 'var(--text-3)' : 'var(--text-1)',
                  }}
                />
              </div>
            )
          })}
        </div>
      </Field>

      <Field label="One focus behaviour to practise">
        <Input
          value={plan.focusBehavior ?? planDefaults.focusBehavior ?? ''}
          onChange={(e) => setDailyPlan(dateKey, { focusBehavior: e.target.value })}
          placeholder="5-sec rule — take action"
        />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="First action" hint="Before phone, before email">
          <Input
            value={plan.firstAction ?? planDefaults.firstAction ?? ''}
            onChange={(e) => setDailyPlan(dateKey, { firstAction: e.target.value })}
            placeholder="Meditation"
          />
        </Field>
        <Field label="Sharpest hours" hint="Block this for the hardest task">
          <Input
            value={plan.energyWindow ?? planDefaults.energyWindow ?? ''}
            onChange={(e) => setDailyPlan(dateKey, { energyWindow: e.target.value })}
            placeholder="8–10pm"
          />
        </Field>
      </div>

      <Field label="One thing to say no to">
        <Input
          value={plan.sayNoTo ?? planDefaults.sayNoTo ?? ''}
          onChange={(e) => setDailyPlan(dateKey, { sayNoTo: e.target.value })}
          placeholder="Rush"
        />
      </Field>
    </Card>
  )
}

export function DailyReviewForm({ dateKey = todayKey() }) {
  const { dailyReview, setDailyReview } = useGrowth()
  const review = dailyReview[dateKey] || {}

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
          Daily review
        </h2>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
          Look back before you look forward. 3 minutes.
        </p>
      </div>

      <Field label="What did I actually do today?">
        <Textarea
          rows={2}
          value={review.didToday || ''}
          onChange={(e) => setDailyReview(dateKey, { didToday: e.target.value })}
          placeholder="Work, gym, English, anything"
        />
      </Field>

      <Field label="Money today" hint="In / out, or a decision you noticed">
        <Input
          value={review.money || ''}
          onChange={(e) => setDailyReview(dateKey, { money: e.target.value })}
        />
      </Field>

      <Field label="One behaviour I noticed" hint="Good or bad — log it below if it repeats">
        <Input
          value={review.behaviorNoticed || ''}
          onChange={(e) => setDailyReview(dateKey, { behaviorNoticed: e.target.value })}
        />
      </Field>

      <Field label="🏆 One win" hint="The smallest one counts — this is your evidence file">
        <Input
          value={review.win || ''}
          onChange={(e) => setDailyReview(dateKey, { win: e.target.value })}
        />
      </Field>
    </Card>
  )
}

const FIX_OPTIONS = [
  { value: 'yes', label: 'Yes — used the fix' },
  { value: 'partial', label: 'Partly' },
  { value: 'no', label: 'No' },
]

export function TriggerLogSheet({ open, onClose }) {
  const { addTriggerLog } = useGrowth()
  const [trigger, setTrigger] = useState('')
  const [behavior, setBehavior] = useState(BEHAVIORS[0].id)
  const [fixUsed, setFixUsed] = useState('no')
  const [nextTime, setNextTime] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setTrigger('')
      setNextTime('')
      setFixUsed('no')
      setError('')
    }
  }, [open])

  const submit = (e) => {
    e.preventDefault()
    const res = addTriggerLog({ trigger, behavior, fixUsed, nextTime })
    if (!res.ok) {
      setError(res.error)
      return
    }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Log a trigger">
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <p className="text-xs" style={{ color: 'var(--text-2)' }}>
          Only log when a behaviour fires. No daily quota, no guilt for empty days. 30 seconds.
        </p>
        <Field label="What happened?">
          <Input value={trigger} onChange={(e) => setTrigger(e.target.value)} required />
        </Field>
        <Field label="Which behaviour?">
          <Select value={behavior} onChange={(e) => setBehavior(e.target.value)}>
            {BEHAVIORS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label} — {b.fix}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Did you use the fix?">
          <Select value={fixUsed} onChange={(e) => setFixUsed(e.target.value)}>
            {FIX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Next time I will…">
          <Textarea rows={2} value={nextTime} onChange={(e) => setNextTime(e.target.value)} />
        </Field>
        {error && (
          <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}
        <Button type="submit" size="lg" full>
          Log it
        </Button>
      </form>
    </Sheet>
  )
}

export function TriggerLogList({ limit = 8 }) {
  const { triggerLog, deleteTriggerLog } = useGrowth()
  if (!triggerLog.length) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-3)' }}>
        Nothing logged yet. That’s allowed — only log when a behaviour actually fires.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      {triggerLog.slice(0, limit).map((t) => {
        const behavior = BEHAVIORS.find((b) => b.id === t.behavior)
        return (
          <div
            key={t.id}
            className="group flex items-start gap-3 rounded-xl px-3 py-2.5"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                {t.trigger}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
                {behavior?.label || t.behavior} · fix used: {t.fixUsed} · {t.date}
              </p>
              {t.nextTime && (
                <p className="mt-1 text-xs italic" style={{ color: 'var(--text-3)' }}>
                  Next time: {t.nextTime}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => deleteTriggerLog(t.id)}
              aria-label="Delete log entry"
              className="shrink-0 opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
              style={{ color: 'var(--text-3)' }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

const WEEKLY_QUESTIONS = [
  ['firedMost', 'Behaviour that fired most this week'],
  ['wins', 'Where did I win? (specific moments)'],
  ['froze', 'Where did I freeze / default to the old pattern?'],
  ['nextFocus', 'One focus behaviour for next week'],
  ['envChange', 'One environment change to make it easier'],
]

export function WeeklyReviewSheet({ open, onClose }) {
  const { weeklyReview, setWeeklyReview } = useGrowth()
  const weekKey = isoWeekKey()
  const answers = weeklyReview[weekKey] || {}

  return (
    <Sheet open={open} onClose={onClose} title={`Weekly review · ${weekKey}`}>
      <div className="flex flex-col gap-3.5">
        <p className="text-xs" style={{ color: 'var(--text-2)' }}>
          Every Friday, 10 minutes. Let the charts confirm or correct your gut.
        </p>
        {WEEKLY_QUESTIONS.map(([key, label]) => (
          <Field key={key} label={label}>
            <Textarea
              rows={2}
              value={answers[key] || ''}
              onChange={(e) => setWeeklyReview(weekKey, { [key]: e.target.value })}
            />
          </Field>
        ))}
        <Button size="lg" full onClick={onClose}>
          Done
        </Button>
      </div>
    </Sheet>
  )
}

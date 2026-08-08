'use client'

import { useMemo, useState } from 'react'
import { Check, Flame, MoreHorizontal, Trash2 } from 'lucide-react'
import { useGrowth } from '../../context/GrowthContext'
import {
  DAY_LABELS,
  currentStreak,
  habitSeries,
  isHabitDone,
  isHabitDue,
  habitEntry,
  todayKey,
} from '../../lib/growthMath'
import { Button, Card, Field, Input, Select, Sheet } from '../ui'

export function StreakBadge({ count }) {
  if (!count) return null
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums"
      style={{ background: 'rgba(245,158,11,0.14)', color: '#f59e0b' }}
      title={`${count} day streak`}
    >
      <Flame className="h-3 w-3" />
      {count}
    </span>
  )
}

/** One tappable habit row. Counted habits advance by one per tap. */
export function HabitRow({ habit, dateKey = todayKey(), onEdit }) {
  const { habitLog, toggleHabit } = useGrowth()
  const due = isHabitDue(habit, dateKey)
  const done = isHabitDone(habit, habitLog, dateKey)
  const entry = habitEntry(habitLog, dateKey, habit.id)
  const target = Number(habit.target || 1)
  const value = Number(entry?.value || 0)
  const { streak } = useMemo(() => currentStreak(habit, habitLog, dateKey), [habit, habitLog, dateKey])

  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors"
      style={{
        background: done ? 'rgba(34,197,94,0.08)' : 'var(--input-bg)',
        border: `1px solid ${done ? 'rgba(34,197,94,0.22)' : 'var(--card-border)'}`,
        opacity: due ? 1 : 0.5,
      }}
    >
      <button
        type="button"
        onClick={() => toggleHabit(habit, dateKey)}
        aria-pressed={done}
        aria-label={`${done ? 'Undo' : 'Mark done'}: ${habit.name}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-transform active:scale-90"
        style={{
          background: done ? habit.color : `${habit.color}1f`,
          color: done ? '#fff' : habit.color,
          border: `1px solid ${done ? habit.color : 'transparent'}`,
        }}
      >
        {done ? <Check className="h-5 w-5" strokeWidth={3} /> : <span aria-hidden>{habit.emoji || '✅'}</span>}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className="truncate text-sm font-bold"
            style={{
              color: 'var(--text-1)',
              textDecoration: done ? 'line-through' : 'none',
              textDecorationColor: 'var(--text-3)',
            }}
          >
            {habit.name}
          </p>
          <StreakBadge count={streak} />
        </div>
        <p className="mt-0.5 text-xs font-medium" style={{ color: 'var(--text-2)' }}>
          {!due
            ? `Rest day · ${(habit.daysOfWeek || []).map((d) => DAY_LABELS[d]).join(' ') || 'not scheduled'}`
            : target > 1
              ? `${value} / ${target} ${habit.unit || ''}`.trim()
              : habit.group || 'Daily'}
        </p>
      </div>

      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(habit)}
          aria-label={`Edit ${habit.name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-3)' }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

/** 12-week completion grid for one habit. */
export function HabitHeatmap({ habit, weeks = 12 }) {
  const { habitLog } = useGrowth()
  const days = weeks * 7
  const series = useMemo(() => habitSeries(habit, habitLog, days), [habit, habitLog, days])

  // Group into columns of 7 (a week per column)
  const columns = []
  for (let i = 0; i < series.length; i += 7) columns.push(series.slice(i, i + 7))

  return (
    <div className="scroll-touch overflow-x-auto">
      <div className="flex gap-1" style={{ minWidth: columns.length * 14 }}>
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-1">
            {col.map((d) => (
              <div
                key={d.key}
                title={`${d.key}${d.done ? ' · done' : d.due ? ' · missed' : ' · rest'}`}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: d.done
                    ? habit.color
                    : d.due
                      ? 'rgba(var(--accent-rgb),0.10)'
                      : 'transparent',
                  border: d.due && !d.done ? '1px solid var(--card-border)' : 'none',
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

const CADENCES = [
  { value: 'daily', label: 'Every day' },
  { value: 'custom', label: 'Specific days' },
]

const EMOJI_CHOICES = ['✅', '🎙️', '🔤', '🎧', '⚡', '📝', '🏆', '⏱️', '🛡️', '🎯', '🏅', '🤝', '💼', '🏋️', '💧', '🍽️', '🥘', '💰', '📖', '🌙', '🧘', '🧩']

/** Create / edit sheet. Passing `habit` switches it to edit mode. */
export function HabitFormSheet({ open, onClose, habit }) {
  const { addHabit, updateHabit, deleteHabit } = useGrowth()
  const editing = !!habit

  const [name, setName] = useState(habit?.name || '')
  const [emoji, setEmoji] = useState(habit?.emoji || '✅')
  const [color, setColor] = useState(habit?.color || '#6366f1')
  const [group, setGroup] = useState(habit?.group || '')
  const [cadence, setCadence] = useState(habit?.cadence === 'daily' ? 'daily' : habit ? 'custom' : 'daily')
  const [daysOfWeek, setDaysOfWeek] = useState(habit?.daysOfWeek || [])
  const [target, setTarget] = useState(String(habit?.target || 1))
  const [unit, setUnit] = useState(habit?.unit || '')
  const [remindAt, setRemindAt] = useState(habit?.remindAt || '')
  const [error, setError] = useState('')

  // Remount on a different habit — the sheet is keyed by caller, see usage
  const toggleDay = (d) =>
    setDaysOfWeek((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()))

  const submit = (e) => {
    e.preventDefault()
    setError('')
    const payload = {
      name,
      emoji,
      color,
      group,
      cadence,
      daysOfWeek: cadence === 'custom' ? daysOfWeek : [],
      target: Number(target) > 0 ? Number(target) : 1,
      unit,
      remindAt,
    }
    const res = editing ? updateHabit(habit.id, payload) : addHabit(payload)
    if (!res.ok) {
      setError(res.error || 'Could not save.')
      return
    }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit habit' : 'New habit'}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Read 20 minutes" required />
        </Field>

        <Field label="Icon">
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                aria-label={`Icon ${em}`}
                aria-pressed={emoji === em}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base transition-transform active:scale-90"
                style={{
                  background: emoji === em ? 'rgba(var(--accent-rgb),0.14)' : 'var(--input-bg)',
                  border: `1px solid ${emoji === em ? 'var(--accent)' : 'var(--card-border)'}`,
                }}
              >
                {em}
              </button>
            ))}
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Group">
            <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Health" />
          </Field>
          <Field label="Colour">
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ padding: 4, height: 46 }}
            />
          </Field>
        </div>

        <Field label="Repeats">
          <Select value={cadence} onChange={(e) => setCadence(e.target.value)}>
            {CADENCES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>

        {cadence === 'custom' && (
          <div className="flex flex-wrap gap-1.5">
            {DAY_LABELS.map((label, d) => {
              const on = daysOfWeek.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  aria-pressed={on}
                  className="rounded-xl px-3 py-2 text-xs font-bold transition-transform active:scale-95"
                  style={{
                    background: on ? 'rgba(var(--accent-rgb),0.14)' : 'var(--input-bg)',
                    color: on ? 'var(--accent)' : 'var(--text-2)',
                    border: `1px solid ${on ? 'var(--accent)' : 'var(--card-border)'}`,
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Daily target" hint="1 = simple tick">
            <Input
              type="number"
              min="1"
              inputMode="numeric"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </Field>
          <Field label="Unit">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="glasses" />
          </Field>
        </div>

        <Field label="Reminder" hint="Fires while Livio is open or running in the background">
          <Input type="time" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} />
        </Field>

        {error && (
          <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <Button type="submit" size="lg" full>
          {editing ? 'Save changes' : 'Add habit'}
        </Button>

        {editing && (
          <Button
            variant="danger"
            full
            onClick={() => {
              deleteHabit(habit.id)
              onClose()
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete habit
          </Button>
        )}
      </form>
    </Sheet>
  )
}

/** Habits grouped by their `group` field, each group in its own card. */
export function HabitGroups({ habits, dateKey, onEdit }) {
  const groups = useMemo(() => {
    const map = new Map()
    habits.forEach((h) => {
      const key = h.group || 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(h)
    })
    return [...map.entries()]
  }, [habits])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {groups.map(([group, items]) => (
        <Card key={group} className="flex flex-col gap-2">
          <h3
            className="mb-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--text-3)' }}
          >
            {group}
          </h3>
          {items.map((h) => (
            <HabitRow key={h.id} habit={h} dateKey={dateKey} onEdit={onEdit} />
          ))}
        </Card>
      ))}
    </div>
  )
}

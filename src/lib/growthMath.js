/**
 * Date, streak and progress maths for the Growth module.
 * All dates are local-calendar 'YYYY-MM-DD' strings — never UTC-sliced ISO,
 * which shifts the day backwards for anyone east of Greenwich (BDT is +6).
 */

export function toDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayKey() {
  return toDateKey(new Date())
}

export function dateFromKey(key) {
  const [y, m, d] = String(key).split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function addDays(key, delta) {
  const d = dateFromKey(key)
  d.setDate(d.getDate() + delta)
  return toDateKey(d)
}

export function tomorrowKey() {
  return addDays(todayKey(), 1)
}

/** 0 = Sunday … 6 = Saturday */
export function dayOfWeek(key) {
  return dateFromKey(key).getDay()
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function formatDayLabel(key) {
  const d = dateFromKey(key)
  return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })
}

/** ISO-8601 week key, e.g. 2026-W32 — used for the weekly review log. */
export function isoWeekKey(key = todayKey()) {
  const d = dateFromKey(key)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  // Thursday of the current ISO week determines the year
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7))
  const isoYear = target.getFullYear()
  const firstThursday = new Date(isoYear, 0, 4)
  firstThursday.setDate(firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7))
  const week = 1 + Math.round((target - firstThursday) / (7 * 24 * 60 * 60 * 1000))
  return `${isoYear}-W${String(week).padStart(2, '0')}`
}

/** Is this habit scheduled on the given date? */
export function isHabitDue(habit, key) {
  if (!habit || habit.archived) return false
  if (habit.cadence === 'weekly' || habit.cadence === 'custom') {
    const days = Array.isArray(habit.daysOfWeek) ? habit.daysOfWeek : []
    if (!days.length) return true
    return days.includes(dayOfWeek(key))
  }
  return true // daily
}

export function habitEntry(habitLog, key, habitId) {
  return habitLog?.[key]?.[habitId] || null
}

export function isHabitDone(habit, habitLog, key) {
  const entry = habitEntry(habitLog, key, habit.id)
  if (!entry) return false
  if (habit.target > 1) return Number(entry.value || 0) >= Number(habit.target)
  return !!entry.done
}

/**
 * Current streak — consecutive *due* days ending today (or yesterday, so a day
 * that hasn't been ticked yet doesn't visually reset a live streak).
 */
export function currentStreak(habit, habitLog, from = todayKey()) {
  let streak = 0
  let key = from
  let checkedToday = false

  for (let i = 0; i < 400; i++) {
    if (isHabitDue(habit, key)) {
      if (isHabitDone(habit, habitLog, key)) {
        streak++
      } else if (i === 0) {
        // today not done yet — keep walking back without breaking
        checkedToday = true
      } else {
        break
      }
    }
    key = addDays(key, -1)
  }
  return { streak, pendingToday: checkedToday }
}

export function longestStreak(habit, habitLog, days = 365) {
  let best = 0
  let run = 0
  let key = addDays(todayKey(), -days)
  for (let i = 0; i <= days; i++) {
    if (isHabitDue(habit, key)) {
      if (isHabitDone(habit, habitLog, key)) {
        run++
        if (run > best) best = run
      } else {
        run = 0
      }
    }
    key = addDays(key, 1)
  }
  return best
}

/** Completion ratio across all due habits for a date. */
export function dayCompletion(habits, habitLog, key = todayKey()) {
  const due = habits.filter((h) => isHabitDue(h, key))
  if (!due.length) return { done: 0, total: 0, pct: 0 }
  const done = due.filter((h) => isHabitDone(h, habitLog, key)).length
  return { done, total: due.length, pct: Math.round((done / due.length) * 100) }
}

/** Last N days of completion, oldest first — feeds the heatmap. */
export function completionSeries(habits, habitLog, days = 84) {
  const out = []
  let key = addDays(todayKey(), -(days - 1))
  for (let i = 0; i < days; i++) {
    out.push({ key, ...dayCompletion(habits, habitLog, key) })
    key = addDays(key, 1)
  }
  return out
}

/** Per-habit history for its own heatmap row. */
export function habitSeries(habit, habitLog, days = 84) {
  const out = []
  let key = addDays(todayKey(), -(days - 1))
  for (let i = 0; i < days; i++) {
    out.push({
      key,
      due: isHabitDue(habit, key),
      done: isHabitDone(habit, habitLog, key),
    })
    key = addDays(key, 1)
  }
  return out
}

// ── Goals ──────────────────────────────────────────────────────────────────

export function goalProgress(goal, { financeValue } = {}) {
  if (!goal) return { pct: 0, current: 0, target: 0 }

  if (goal.kind === 'milestone') {
    const ms = goal.milestones || []
    if (!ms.length) return { pct: goal.status === 'done' ? 100 : 0, current: 0, target: 0 }
    const done = ms.filter((m) => m.done).length
    return { pct: Math.round((done / ms.length) * 100), current: done, target: ms.length }
  }

  const target = Number(goal.target || 0)
  const current = goal.financeLink && Number.isFinite(financeValue)
    ? Number(financeValue)
    : Number(goal.current || 0)
  if (target <= 0) return { pct: 0, current, target }
  return { pct: Math.min(100, Math.round((current / target) * 100)), current, target }
}

/** Days left, and the run-rate needed to still land it on time. */
export function goalPacing(goal, progress) {
  if (!goal?.dueDate) return null
  const today = dateFromKey(todayKey())
  const due = dateFromKey(goal.dueDate)
  const daysLeft = Math.ceil((due - today) / (24 * 60 * 60 * 1000))
  const remaining = Math.max(0, (progress.target || 0) - (progress.current || 0))
  if (daysLeft <= 0) return { daysLeft, overdue: true, perMonth: remaining }
  const months = Math.max(1, daysLeft / 30.44)
  return { daysLeft, overdue: false, perMonth: Math.ceil(remaining / months) }
}

// ── Routines ───────────────────────────────────────────────────────────────

export function blocksForMode(routine, mode) {
  const blocks = routine?.blocks || []
  if (!mode || mode === 'full') return blocks
  return blocks.filter((b) => (b.modes || ['full']).includes(mode))
}

export function routineMinutes(blocks) {
  return blocks.reduce((s, b) => s + Number(b.minutes || 0), 0)
}

export function weeklyFocusFor(routine, key = todayKey()) {
  const map = routine?.weeklyFocus
  if (!map) return null
  return map[String(dayOfWeek(key))] || null
}

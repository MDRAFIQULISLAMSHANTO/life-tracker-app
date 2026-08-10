'use client'

/**
 * Task primitives shared by the dashboard card and the full tasks page, so the
 * two can never drift on validation, styling or what a "task" is.
 */

import { useEffect, useMemo, useState } from 'react'
import { Check, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { TASK_PRIORITIES, useDashboardToday } from '../../context/DashboardTodayContext'
import { Button, Field, Input, Select, Sheet, Textarea } from '../ui'

export const PRIORITY_META = {
  high: { label: 'High', color: '#ef4444' },
  normal: { label: 'Normal', color: 'var(--accent)' },
  low: { label: 'Low', color: '#64748b' },
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function isValidHttpUrl(str) {
  if (!str) return false
  try {
    const u = new URL(str)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** Human deadline label + urgency, used for colour and sorting hints. */
export function dueMeta(task) {
  if (!task.dueDate) return { label: 'No date', tone: 'muted' }
  const today = todayISO()
  if (task.completed) return { label: task.dueDate, tone: 'muted' }
  if (task.dueDate < today) {
    const days = Math.round((new Date(today) - new Date(task.dueDate)) / 86400000)
    return { label: days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`, tone: 'overdue' }
  }
  if (task.dueDate === today) return { label: 'Due today', tone: 'today' }
  const days = Math.round((new Date(task.dueDate) - new Date(today)) / 86400000)
  if (days === 1) return { label: 'Due tomorrow', tone: 'soon' }
  if (days <= 7) return { label: `Due in ${days} days`, tone: 'soon' }
  return { label: task.dueDate, tone: 'muted' }
}

const TONE_COLOR = {
  overdue: '#ef4444',
  today: '#f59e0b',
  soon: 'var(--text-2)',
  muted: 'var(--text-3)',
}

/** Incomplete first, then by deadline, then by priority. */
export function sortTasks(tasks) {
  const rank = { high: 0, normal: 1, low: 2 }
  return [...tasks].sort((a, b) => {
    if (!!a.completed !== !!b.completed) return a.completed ? 1 : -1
    const ad = a.dueDate || '9999-12-31'
    const bd = b.dueDate || '9999-12-31'
    if (ad !== bd) return ad < bd ? -1 : 1
    return (rank[a.priority] ?? 1) - (rank[b.priority] ?? 1)
  })
}

export function TaskRow({ task, onEdit, compact = false }) {
  const { toggleTask, deleteTask } = useDashboardToday()
  const due = dueMeta(task)
  const priority = PRIORITY_META[task.priority] || PRIORITY_META.normal

  return (
    <div className="item-row group flex items-start gap-2.5">
      <button
        type="button"
        onClick={() => toggleTask(task.id)}
        aria-label={task.completed ? `Mark ${task.title} not done` : `Mark ${task.title} done`}
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded transition-all"
        style={{
          border: task.completed ? 'none' : '1.5px solid var(--input-border)',
          background: task.completed ? '#22c55e' : 'transparent',
        }}
      >
        {task.completed && <Check className="h-2.5 w-2.5 text-white" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {task.priority === 'high' && !task.completed && (
            <span
              aria-hidden
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: priority.color }}
            />
          )}
          <p
            className="truncate text-xs font-semibold"
            style={{
              color: 'var(--text-1)',
              textDecoration: task.completed ? 'line-through' : 'none',
              opacity: task.completed ? 0.5 : 1,
            }}
          >
            {task.title}
          </p>
        </div>

        <p
          className="mt-0.5 text-[10px] font-medium"
          style={{ color: TONE_COLOR[due.tone] }}
        >
          {due.label}
          {task.time ? ` · ${task.time}` : ''}
          {!compact && task.priority !== 'normal' ? ` · ${priority.label}` : ''}
        </p>

        {!compact && task.notes && (
          <p className="mt-1 text-[11px] leading-snug" style={{ color: 'var(--text-2)' }}>
            {task.notes}
          </p>
        )}

        {task.link && isValidHttpUrl(task.link) && (
          <a
            href={task.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium hover:underline"
            style={{ color: 'var(--accent)' }}
          >
            <ExternalLink className="h-2.5 w-2.5" /> Link
          </a>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label={`Edit ${task.title}`}
          className="rounded-lg p-1"
          style={{ color: 'var(--text-2)' }}
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => deleteTask(task.id)}
          aria-label={`Delete ${task.title}`}
          className="rounded-lg p-1"
          style={{ color: '#ef4444' }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

/** Create/edit sheet. Pass `task` to edit, omit it to create. */
export function TaskFormSheet({ open, onClose, task, defaultDate }) {
  const { addTask, updateTask, deleteTask } = useDashboardToday()
  const editing = !!task

  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState('normal')
  const [notes, setNotes] = useState('')
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  // Refill whenever the sheet opens, so editing one task then another doesn't
  // show the previous task's values.
  useEffect(() => {
    if (!open) return
    setTitle(task?.title || '')
    setDueDate(task?.dueDate || defaultDate || todayISO())
    setTime(task?.time || '')
    setPriority(task?.priority || 'normal')
    setNotes(task?.notes || '')
    setLink(task?.link || '')
    setError('')
  }, [open, task, defaultDate])

  const submit = (e) => {
    e.preventDefault()
    const payload = { title, dueDate, time, priority, notes, link }
    const res = editing ? updateTask(task.id, payload) : addTask(payload)
    if (!res.ok) {
      setError(res.error || 'Could not save.')
      return
    }
    onClose()
  }

  const remove = () => {
    deleteTask(task.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit task' : 'New task'}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Task">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Send the invoice"
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Deadline">
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <Field label="Priority">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_META[p].label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Remind me at" hint="Optional — leave empty for a deadline with no notification">
          <Input value={time} onChange={(e) => setTime(e.target.value)} placeholder="5:00 PM" />
        </Field>

        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </Field>

        <Field label="Link">
          <Input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
          />
        </Field>

        {error && (
          <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}

        <Button type="submit" size="lg" full>
          {editing ? 'Save changes' : 'Add task'}
        </Button>
        {editing && (
          <Button type="button" variant="danger" onClick={remove} full>
            <Trash2 className="h-4 w-4" /> Delete task
          </Button>
        )}
      </form>
    </Sheet>
  )
}

/** Counts used by both the card and the page header. */
export function useTaskCounts(tasks) {
  return useMemo(() => {
    const today = todayISO()
    const open = tasks.filter((t) => !t.completed)
    return {
      open: open.length,
      overdue: open.filter((t) => t.dueDate && t.dueDate < today).length,
      today: open.filter((t) => t.dueDate === today).length,
      done: tasks.length - open.length,
    }
  }, [tasks])
}

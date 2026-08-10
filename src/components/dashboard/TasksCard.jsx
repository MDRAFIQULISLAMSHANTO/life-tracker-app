'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ListChecks, Plus } from 'lucide-react'
import { useDashboardToday } from '../../context/DashboardTodayContext'
import { TaskFormSheet, TaskRow, sortTasks, todayISO, useTaskCounts } from './TaskBits'

const PREVIEW_LIMIT = 6

/**
 * Dashboard view of the task list: what is overdue or due soon, not everything.
 * The full list, with filters, lives at /dashboard/tasks.
 */
export default function TasksCard() {
  const { tasks } = useDashboardToday()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const counts = useTaskCounts(tasks)

  // Open tasks that are actually actionable now — overdue or due within a week.
  // A deadline three months out shouldn't crowd today's view.
  const focus = useMemo(() => {
    const today = todayISO()
    const horizon = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const open = tasks.filter((t) => !t.completed && (!t.dueDate || t.dueDate <= horizon))
    const sorted = sortTasks(open)
    return { rows: sorted.slice(0, PREVIEW_LIMIT), hidden: Math.max(0, sorted.length - PREVIEW_LIMIT), today }
  }, [tasks])

  const openNew = () => {
    setEditing(null)
    setSheetOpen(true)
  }
  const openEdit = (task) => {
    setEditing(task)
    setSheetOpen(true)
  }

  return (
    <>
      <div className="dashboard-glass-card flex flex-col" style={{ minHeight: 0 }}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" style={{ color: '#f59e0b' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>
              Tasks
            </h3>
            {counts.overdue > 0 && (
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
              >
                {counts.overdue} overdue
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={openNew}
            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold"
            style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}
          >
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>

        {focus.rows.length > 0 ? (
          <div className="flex-1 space-y-2">
            {focus.rows.map((t) => (
              <TaskRow key={t.id} task={t} onEdit={openEdit} compact />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-1 flex-col items-center justify-center py-6"
            style={{ color: 'var(--text-3)' }}
          >
            <ListChecks className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-xs">{counts.open ? 'Nothing due this week' : 'No tasks yet'}</p>
          </div>
        )}

        <Link
          href="/dashboard/tasks"
          className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold"
          style={{ color: 'var(--accent)' }}
        >
          {focus.hidden > 0 ? `${focus.hidden} more · All tasks` : 'All tasks'}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <TaskFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} task={editing} />
    </>
  )
}

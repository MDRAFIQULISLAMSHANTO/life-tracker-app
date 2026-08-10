'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, CheckCircle2, ListChecks, Plus } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useDashboardToday } from '../../../context/DashboardTodayContext'
import {
  TaskFormSheet,
  TaskRow,
  sortTasks,
  todayISO,
  useTaskCounts,
} from '../../../components/dashboard/TaskBits'
import { Button, Card, EmptyState, PageHeader, Select, StatTile } from '../../../components/ui'

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'today', label: 'Due today' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'week', label: 'Next 7 days' },
  { value: 'done', label: 'Completed' },
  { value: 'all', label: 'All' },
]

export default function TasksPage() {
  const { user, loading } = useAuth()
  const { tasks } = useDashboardToday()
  const [filter, setFilter] = useState('open')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const counts = useTaskCounts(tasks)

  const visible = useMemo(() => {
    const today = todayISO()
    const horizon = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
    const open = (t) => !t.completed
    const byFilter = {
      open,
      done: (t) => t.completed,
      today: (t) => open(t) && t.dueDate === today,
      overdue: (t) => open(t) && t.dueDate && t.dueDate < today,
      week: (t) => open(t) && t.dueDate && t.dueDate >= today && t.dueDate <= horizon,
      all: () => true,
    }
    return sortTasks(tasks.filter(byFilter[filter] || open))
  }, [tasks, filter])

  // Group by deadline so the list reads as a schedule rather than a wall.
  const groups = useMemo(() => {
    const today = todayISO()
    const map = new Map()
    visible.forEach((t) => {
      let key
      if (t.completed) key = 'Completed'
      else if (!t.dueDate) key = 'No deadline'
      else if (t.dueDate < today) key = 'Overdue'
      else if (t.dueDate === today) key = 'Today'
      else key = t.dueDate
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    })
    return [...map.entries()]
  }, [visible])

  const openNew = () => {
    setEditing(null)
    setSheetOpen(true)
  }
  const openEdit = (task) => {
    setEditing(task)
    setSheetOpen(true)
  }

  if (loading || !user) return null

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Everything with a deadline, in one list."
        icon={ListChecks}
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            New task
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Open" value={counts.open} hint="not done yet" icon={ListChecks} />
        <StatTile
          label="Overdue"
          value={counts.overdue}
          hint={counts.overdue ? 'needs attention' : 'all clear'}
          tone={counts.overdue ? 'negative' : 'positive'}
          icon={AlertTriangle}
        />
        <StatTile label="Due today" value={counts.today} hint="on the clock" icon={CalendarDays} />
        <StatTile label="Completed" value={counts.done} hint="all time" icon={CheckCircle2} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
          {FILTERS.find((f) => f.value === filter)?.label || 'Tasks'}
        </h2>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter tasks"
          style={{ width: 'auto', minHeight: 38 }}
        >
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nothing here"
          description="Add a task with a deadline and it will show up on your dashboard as the date approaches."
          action={<Button onClick={openNew}>Add a task</Button>}
        />
      ) : (
        <div className="space-y-4">
          {groups.map(([label, items]) => (
            <Card key={label} className="flex flex-col gap-2">
              <div className="mb-1 flex items-baseline gap-2">
                <h3
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: label === 'Overdue' ? '#ef4444' : 'var(--text-3)' }}
                >
                  {label}
                </h3>
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-3)' }}>
                  {items.length}
                </span>
              </div>
              {items.map((t) => (
                <TaskRow key={t.id} task={t} onEdit={openEdit} />
              ))}
            </Card>
          ))}
        </div>
      )}

      <TaskFormSheet open={sheetOpen} onClose={() => setSheetOpen(false)} task={editing} />
    </div>
  )
}

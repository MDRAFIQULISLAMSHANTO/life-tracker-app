'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, Check, Pause, Pencil, Play, Plus, Repeat, SkipForward, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency } from '../../../utils/formatters'
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Select,
  Sheet,
  StatTile,
  Textarea,
} from '../../../components/ui'

const BLANK = {
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  accountId: '',
  dayOfMonth: 1,
  mode: 'approve',
  endMonth: '',
  active: true,
}

function monthLabel(monthKey) {
  const [y, m] = String(monthKey).split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export default function RecurringPage() {
  const { user, loading } = useAuth()
  const {
    currency,
    accounts,
    expenseCategories,
    incomeCategories,
    otherCategories,
    recurring,
    pendingRecurring,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    postRecurring,
    skipRecurring,
  } = useFinance()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(BLANK)
  const [error, setError] = useState('')

  const monthlyTotals = useMemo(() => {
    const live = recurring.filter((r) => r.active)
    const income = live.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
    const expense = live.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
    return { income, expense, net: income - expense }
  }, [recurring])

  const categories =
    draft.type === 'income'
      ? [...incomeCategories, ...otherCategories]
      : [...expenseCategories, ...otherCategories]

  const openNew = () => {
    setEditingId(null)
    setDraft({ ...BLANK, accountId: accounts[0]?.id || '', category: expenseCategories[0] || 'Other' })
    setError('')
    setSheetOpen(true)
  }

  const openEdit = (rule) => {
    setEditingId(rule.id)
    setDraft({ ...BLANK, ...rule, amount: String(rule.amount) })
    setError('')
    setSheetOpen(true)
  }

  const submit = (e) => {
    e.preventDefault()
    const res = editingId ? updateRecurring(editingId, draft) : addRecurring(draft)
    if (!res.ok) {
      setError(res.error || 'Could not save.')
      return
    }
    setSheetOpen(false)
  }

  if (loading || !user) return null

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="Recurring"
        subtitle="Things that happen every month. Each one decides whether it posts itself or waits for you."
        icon={Repeat}
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" /> New recurring
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label="Every month in" value={formatCurrency(monthlyTotals.income, currency)} hint="active rules" />
        <StatTile label="Every month out" value={formatCurrency(monthlyTotals.expense, currency)} hint="active rules" />
        <StatTile
          label="Net"
          value={formatCurrency(monthlyTotals.net, currency)}
          tone={monthlyTotals.net >= 0 ? 'positive' : 'negative'}
          hint="before anything else"
        />
        <StatTile label="Waiting" value={pendingRecurring.length} hint="need a decision" />
      </div>

      {pendingRecurring.length > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" style={{ color: 'var(--accent)' }} />
            <h2 className="text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
              Waiting for you
            </h2>
          </div>
          {pendingRecurring.map(({ rule, monthKey }) => (
            <div
              key={`${rule.id}-${monthKey}`}
              className="flex flex-wrap items-center gap-2 rounded-2xl px-3.5 py-3"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                  {rule.description || rule.category}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-2)' }}>
                  {monthLabel(monthKey)} · {rule.category} ·{' '}
                  <span style={{ color: rule.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {rule.type === 'income' ? '+' : '−'}
                    {formatCurrency(rule.amount, currency)}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => skipRecurring(rule.id, monthKey)}>
                  <SkipForward className="h-3.5 w-3.5" /> Skip
                </Button>
                <Button size="sm" onClick={() => postRecurring(rule.id, monthKey)}>
                  <Check className="h-3.5 w-3.5" /> Add it
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {recurring.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Nothing repeats yet"
          description="Add rent, salary or a subscription once and stop retyping it every month."
          action={<Button onClick={openNew}>Add the first one</Button>}
        />
      ) : (
        <Card className="flex flex-col gap-2">
          <h2 className="mb-1 text-lg font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
            All rules
          </h2>
          {recurring.map((rule) => (
            <div
              key={rule.id}
              className="group flex flex-wrap items-center gap-2 rounded-2xl px-3.5 py-3"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--card-border)',
                opacity: rule.active ? 1 : 0.55,
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold" style={{ color: 'var(--text-1)' }}>
                    {rule.description || rule.category}
                  </p>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={
                      rule.mode === 'auto'
                        ? { background: 'rgba(var(--accent-rgb),0.14)', color: 'var(--accent)' }
                        : { background: 'var(--card-border)', color: 'var(--text-2)' }
                    }
                  >
                    {rule.mode === 'auto' ? 'Automatic' : 'Ask me'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-2)' }}>
                  Day {rule.dayOfMonth} · {rule.category} ·{' '}
                  <span style={{ color: rule.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                    {rule.type === 'income' ? '+' : '−'}
                    {formatCurrency(rule.amount, currency)}
                  </span>
                  {rule.endMonth ? ` · until ${monthLabel(rule.endMonth)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => updateRecurring(rule.id, { active: !rule.active })}
                  aria-label={rule.active ? 'Pause' : 'Resume'}
                >
                  {rule.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(rule)} aria-label="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (window.confirm(`Stop "${rule.description || rule.category}" repeating? Entries already added stay.`)) {
                      deleteRecurring(rule.id)
                    }
                  }}
                  aria-label="Delete"
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? 'Edit recurring' : 'New recurring'}
      >
        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <Select
                value={draft.type}
                onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value, category: '' }))}
              >
                <option value="expense">Money out</option>
                <option value="income">Money in</option>
              </Select>
            </Field>
            <Field label="Amount">
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={draft.amount}
                onChange={(e) => setDraft((d) => ({ ...d, amount: e.target.value }))}
                required
              />
            </Field>
          </div>

          <Field label="What is it?">
            <Input
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="Rent"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              >
                <option value="">Choose…</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Account">
              <Select
                value={draft.accountId}
                onChange={(e) => setDraft((d) => ({ ...d, accountId: e.target.value }))}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Day of month" hint="31 lands on the last day in short months">
              <Input
                type="number"
                min="1"
                max="31"
                value={draft.dayOfMonth}
                onChange={(e) => setDraft((d) => ({ ...d, dayOfMonth: e.target.value }))}
              />
            </Field>
            <Field label="Stop after" hint="Leave empty to keep going">
              <Input
                type="month"
                value={draft.endMonth}
                onChange={(e) => setDraft((d) => ({ ...d, endMonth: e.target.value }))}
              />
            </Field>
          </div>

          <Field
            label="How should it happen?"
            hint={
              draft.mode === 'auto'
                ? 'Added to your ledger on its own, every month.'
                : 'Appears in "Waiting for you" each month until you add or skip it.'
            }
          >
            <Select value={draft.mode} onChange={(e) => setDraft((d) => ({ ...d, mode: e.target.value }))}>
              <option value="approve">Ask me first</option>
              <option value="auto">Add it automatically</option>
            </Select>
          </Field>

          {error && (
            <p className="text-xs font-semibold" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          <Button type="submit" size="lg" full>
            {editingId ? 'Save changes' : 'Create'}
          </Button>
        </form>
      </Sheet>
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { usePrivacy } from '../../../context/PrivacyContext'
import { formatCurrency } from '../../../utils/formatters'
import TransactionEditSheet from '../../../components/finance/TransactionEditSheet'
import { Button, Card, Field, Input, PageHeader, SegmentedControl, Select, StatTile } from '../../../components/ui'

const labelCls = 'block text-xs font-bold mb-1.5 uppercase tracking-wide'
const labelStyle = { color: 'var(--text-3)' }

/**
 * One ledger.
 *
 * Income and Expenses used to be two pages that were byte-for-byte identical
 * apart from the word "income" — same form, same table, same totals. Nobody
 * thinks "I'll open the income screen"; they think "what happened to my
 * money". So this is one list with a direction filter, and search that works
 * across every month rather than only the one the ledger is parked on.
 */
export default function LedgerPage() {
  const { user, loading } = useAuth()
  const {
    currency,
    ledgerMonthKey,
    expenseCategories,
    incomeCategories,
    otherCategories,
    accounts,
    transactions,
    addTransaction,
    deleteTransaction,
  } = useFinance()
  const { mask } = usePrivacy()

  const [direction, setDirection] = useState('all')
  const [scope, setScope] = useState('month')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)

  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [accountId, setAccountId] = useState('')
  const [submitError, setSubmitError] = useState('')

  const formCategories =
    type === 'income' ? [...incomeCategories, ...otherCategories] : [...expenseCategories, ...otherCategories]

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return transactions
      .filter((t) => (t.type === 'income' || t.type === 'expense'))
      .filter((t) => (direction === 'all' ? true : t.type === direction))
      // Searching only within one month is what made "what did I spend on food
      // this year" unanswerable, so any query widens the scope automatically.
      .filter((t) => (scope === 'all' || q ? true : String(t.date || '').slice(0, 7) === ledgerMonthKey))
      .filter((t) => {
        if (!q) return true
        return (
          String(t.description || '').toLowerCase().includes(q) ||
          String(t.category || '').toLowerCase().includes(q) ||
          String(t.amount || '').includes(q)
        )
      })
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
  }, [transactions, direction, scope, search, ledgerMonthKey])

  const totals = useMemo(() => {
    const income = rows.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
    const expense = rows.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
    return { income, expense, net: income - expense }
  }, [rows])

  const submit = (e) => {
    e.preventDefault()
    setSubmitError('')
    const res = addTransaction({ type, amount, category, description, date, accountId })
    if (!res.ok) {
      setSubmitError(res.error || 'Failed to add.')
      return
    }
    setAmount('')
    setDescription('')
  }

  if (loading || !user) return null

  const searching = !!search.trim()
  const scopeLabel = searching || scope === 'all' ? 'all time' : ledgerMonthKey

  return (
    <div className="space-y-5 pb-24 sm:space-y-6">
      <PageHeader
        title="Ledger"
        subtitle={`Everything in and out — ${scopeLabel}`}
        icon={ArrowLeftRight}
        actions={
          <Link href="/dashboard/settings">
            <Button variant="secondary" size="sm">Manage categories</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatTile label="In" value={mask(formatCurrency(totals.income, currency))} hint={scopeLabel} />
        <StatTile label="Out" value={mask(formatCurrency(totals.expense, currency))} hint={scopeLabel} />
        <StatTile
          label="Net"
          value={mask(formatCurrency(totals.net, currency))}
          tone={totals.net >= 0 ? 'positive' : 'negative'}
          hint={`${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}`}
        />
      </div>

      {/* Add */}
      <Card>
        <form onSubmit={submit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <SegmentedControl
              value={type}
              onChange={(v) => {
                setType(v)
                setCategory('')
              }}
              options={[
                { value: 'expense', label: 'Money out' },
                { value: 'income', label: 'Money in' },
              ]}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Amount</label>
            <Input type="number" inputMode="decimal" step="0.01" min="0" value={amount}
              onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Category</label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Choose…</option>
              {formCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Account</label>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Note</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>

          {submitError && (
            <p className="text-sm font-semibold md:col-span-2" style={{ color: 'var(--danger)' }}>{submitError}</p>
          )}

          <div className="flex justify-end md:col-span-2">
            <Button type="submit" style={{ background: type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
              <Plus className="h-4 w-4" />
              Add {type === 'income' ? 'income' : 'expense'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: 'var(--text-3)' }} aria-hidden />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search every month…"
            aria-label="Search transactions"
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>
        <SegmentedControl
          size="sm"
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'all', label: 'All' },
            { value: 'income', label: 'In' },
            { value: 'expense', label: 'Out' },
          ]}
        />
        <SegmentedControl
          size="sm"
          value={searching ? 'all' : scope}
          onChange={setScope}
          options={[
            { value: 'month', label: 'This month' },
            { value: 'all', label: 'All time' },
          ]}
        />
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <p className="px-5 py-6 text-sm" style={{ color: 'var(--text-3)' }}>
            {searching ? `Nothing matches “${search.trim()}”.` : 'Nothing here yet.'}
          </p>
        ) : (
          <div className="scroll-touch overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                  {['Date', 'Category', 'Note', 'Amount', ''].map((h) => (
                    <th key={h}
                      className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wide ${h === '' ? 'text-right' : ''}`}
                      style={{ color: 'var(--text-3)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--card-border)' }}>
                    <td className="whitespace-nowrap px-4 py-3 text-xs" style={{ color: 'var(--text-3)' }}>{t.date}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--text-1)' }}>{t.category}</td>
                    <td className="max-w-[220px] truncate px-4 py-3" style={{ color: 'var(--text-2)' }}>
                      {t.description || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold tabular-nums"
                      style={{ color: t.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {mask(`${t.type === 'income' ? '+' : '−'}${formatCurrency(Number(t.amount || 0), currency)}`)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="ml-auto flex items-center justify-end gap-1.5">
                        <button type="button" onClick={() => setEditing(t)} aria-label="Edit entry"
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
                          style={{ background: 'var(--input-bg)', color: 'var(--text-2)' }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button type="button" onClick={() => deleteTransaction(t.id)} aria-label="Delete entry"
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
                          style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--danger)' }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TransactionEditSheet open={!!editing} tx={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

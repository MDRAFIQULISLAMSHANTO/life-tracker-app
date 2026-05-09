'use client'

import { useMemo, useRef, useState } from 'react'
import { BarChart3, ChevronDown, Download, FileSpreadsheet, TrendingDown, TrendingUp, Upload } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency } from '../../../utils/formatters'
import ExpenseDonutChart from '../../../components/charts/ExpenseDonutChart'
import DailyTrendChart from '../../../components/charts/DailyTrendChart'
import {
  downloadMonthExcelReport,
  downloadImportTemplate,
  parseTransactionsFromExcelFile,
} from '../../../lib/excelFinance'

function buildDailyTrendForMonth(ledgerMonthKey, transactions) {
  if (!ledgerMonthKey) return []
  const [y, m] = ledgerMonthKey.split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return []
  const daysInMonth = new Date(y, m, 0).getDate()
  const rows = Array.from({ length: daysInMonth }, (_, i) => ({
    date: String(i + 1),
    income: 0,
    expense: 0,
  }))
  transactions
    .filter((t) => t.date && String(t.date).slice(0, 7) === ledgerMonthKey)
    .forEach((t) => {
      const day = parseInt(String(t.date).slice(8, 10), 10) - 1
      if (day < 0 || day >= daysInMonth) return
      const n = Number(t.amount || 0)
      if (t.type === 'income') rows[day].income += n
      else if (t.type === 'expense') rows[day].expense += n
    })
  return rows
}

const cardStyle = {
  background: 'var(--card-bg)',
  border: '1px solid var(--card-border)',
  borderRadius: 18,
  padding: '20px 24px',
  boxShadow: 'var(--card-shadow)',
}

export default function ReportsPage() {
  const { user, loading } = useAuth()
  const fileInputRef = useRef(null)
  const [importMsg, setImportMsg] = useState('')
  const [importBusy, setImportBusy] = useState(false)

  const {
    currency,
    transactions,
    ledgerMonthKey,
    importTransactionsFromRows,
  } = useFinance()

  const monthTx = useMemo(() => {
    return transactions.filter((t) => t?.date && String(t.date).slice(0, 7) === ledgerMonthKey)
  }, [transactions, ledgerMonthKey])

  const totals = useMemo(() => {
    const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0)
    const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0)
    const loans = monthTx.filter((t) => t.type === 'loan').reduce((s, t) => s + Number(t.amount || 0), 0)
    return { income, expense, loans, net: income - expense }
  }, [monthTx])

  const expenseByCategory = useMemo(() => {
    const map = new Map()
    monthTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => map.set(t.category || 'Other', (map.get(t.category || 'Other') || 0) + Number(t.amount || 0)))
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [monthTx])

  const trendMonth = useMemo(
    () => buildDailyTrendForMonth(ledgerMonthKey, transactions),
    [ledgerMonthKey, transactions]
  )

  const handleExportExcel = () => {
    const summaryLines = [
      ['Metric', 'Value'],
      ['Month', ledgerMonthKey],
      ['Currency', currency],
      ['Total income', totals.income],
      ['Total expense', totals.expense],
      ['Loans (type loan)', totals.loans],
      ['Net (income − expense)', totals.net],
      ['', ''],
      ['Expense by category', 'Amount'],
      ...expenseByCategory.map((e) => [e.name, e.value]),
    ]
    downloadMonthExcelReport({
      monthKey: ledgerMonthKey,
      transactions,
      currency,
      summaryLines,
    })
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportBusy(true)
    setImportMsg('')
    try {
      const buf = await file.arrayBuffer()
      const parsed = parseTransactionsFromExcelFile(buf)
      if (!parsed.ok) {
        setImportMsg(parsed.error || 'Could not read file.')
        setImportBusy(false)
        return
      }
      if (parsed.rowErrors?.length) {
        setImportMsg(`Skipped: ${parsed.rowErrors.slice(0, 5).join('; ')}${parsed.rowErrors.length > 5 ? '…' : ''}`)
      }
      if (!parsed.rows.length) {
        setImportMsg((m) => m || 'No data rows found under the headers.')
        setImportBusy(false)
        return
      }
      const result = importTransactionsFromRows(parsed.rows)
      if (!result.ok) {
        setImportMsg(result.error || 'Import failed.')
        setImportBusy(false)
        return
      }
      const parts = [`Imported ${result.inserted} transaction(s).`]
      if (parsed.rowErrors?.length) {
        parts.push(`File had ${parsed.rowErrors.length} invalid row(s) (skipped before import).`)
      }
      if (result.rowErrors?.length) {
        parts.push(result.rowErrors.slice(0, 4).join(' '))
        if (result.rowErrors.length > 4) parts.push('…')
      }
      setImportMsg(parts.join(' '))
    } catch (err) {
      setImportMsg(err?.message || 'Failed to read file.')
    }
    setImportBusy(false)
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-2)' }}>Loading…</div>
  if (!user) return null

  return (
    <div className="space-y-6 pb-24">
      {/* Header + Excel panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>
            Reports
          </h1>
          <p className="mt-2 text-sm sm:text-base font-medium" style={{ color: 'var(--text-2)' }}>
            Overview for{' '}
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>{ledgerMonthKey}</span>
            {' '}· Export to Excel or import rows using the template.
          </p>
        </div>

        {/* Excel accordion */}
        <details
          className="w-full sm:w-auto sm:min-w-[280px]"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <summary
            style={{
              display: 'flex', cursor: 'pointer', listStyle: 'none',
              alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '12px 16px', minHeight: 44,
              fontSize: 14, fontWeight: 600, color: 'var(--text-1)',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <FileSpreadsheet style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} />
              Excel
            </span>
            <ChevronDown style={{ width: 16, height: 16, color: 'var(--text-3)', flexShrink: 0, transition: 'transform 0.2s' }} />
          </summary>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 8,
            borderTop: '1px solid var(--card-border)',
            padding: 12,
          }}
            className="sm:flex-row sm:flex-wrap"
          >
            <button
              type="button"
              onClick={downloadImportTemplate}
              style={{
                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '10px 16px', minHeight: 44, borderRadius: 12,
                border: '1px solid var(--card-border)',
                background: 'var(--input-bg)',
                color: 'var(--text-1)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <FileSpreadsheet style={{ width: 16, height: 16, flexShrink: 0 }} />
              Template
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importBusy}
              style={{
                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '10px 16px', minHeight: 44, borderRadius: 12,
                border: '1px solid var(--accent)',
                background: 'rgba(var(--accent-rgb),0.08)',
                color: 'var(--accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', opacity: importBusy ? 0.5 : 1,
              }}
            >
              <Upload style={{ width: 16, height: 16, flexShrink: 0 }} />
              {importBusy ? 'Importing…' : 'Import'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, padding: '10px 16px', minHeight: 44, borderRadius: 12, border: 'none',
                background: 'var(--accent)',
                color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Download style={{ width: 16, height: 16, flexShrink: 0 }} />
              Export
            </button>
          </div>
        </details>
      </div>

      {importMsg && (
        <div style={{
          fontSize: 13, borderRadius: 12,
          border: '1px solid var(--card-border)',
          background: 'var(--input-bg)',
          padding: '12px 16px',
          color: 'var(--text-1)',
        }}>{importMsg}</div>
      )}

      <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: -8 }}>
        Import: use the <strong style={{ color: 'var(--text-2)' }}>Transactions</strong> sheet; row 1 headers must be Date, Type, Amount, Category,
        Description, AccountId, SourceLoanId. Types:{' '}
        <code style={{ fontSize: 11, background: 'var(--input-bg)', padding: '1px 5px', borderRadius: 4 }}>income</code>,{' '}
        <code style={{ fontSize: 11, background: 'var(--input-bg)', padding: '1px 5px', borderRadius: 4 }}>expense</code>,{' '}
        <code style={{ fontSize: 11, background: 'var(--input-bg)', padding: '1px 5px', borderRadius: 4 }}>loan</code>.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Income', value: totals.income, Icon: TrendingUp, color: 'var(--success)' },
          { label: 'Expense', value: totals.expense, Icon: TrendingDown, color: 'var(--danger)' },
          { label: 'Loans', value: totals.loans, Icon: BarChart3, color: 'var(--accent)' },
          { label: 'Net (Income − Expense)', value: totals.net, Icon: null, color: totals.net >= 0 ? 'var(--success)' : 'var(--danger)' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
              {Icon && <Icon style={{ width: 18, height: 18, color }} />}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-1)', wordBreak: 'break-word', letterSpacing: '-0.02em' }}>
              {formatCurrency(value, currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseDonutChart data={expenseByCategory} />
        <DailyTrendChart data={trendMonth} />
      </div>
    </div>
  )
}

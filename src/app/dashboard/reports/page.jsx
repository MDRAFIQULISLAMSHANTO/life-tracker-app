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

  if (loading) return <div className="text-text-secondary">Loading...</div>
  if (!user) return null

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Reports</h1>
          <p className="text-gray-500 mt-2 text-sm sm:text-base font-medium">
            Overview for <span className="font-semibold text-text-primary">{ledgerMonthKey}</span> (same month as the
            header). Export to Excel or import rows using the template.
          </p>
        </div>
        <details className="reports-excel-details w-full sm:w-auto sm:min-w-[280px] rounded-xl border border-gray-200 bg-white shadow-soft open:shadow-md">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 min-h-[44px] text-sm font-semibold text-text-primary [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 shrink-0 text-primary" aria-hidden />
              Excel
            </span>
            <ChevronDown className="reports-excel-chevron h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200" aria-hidden />
          </summary>
          <div className="flex flex-col gap-2 border-t border-gray-100 p-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={downloadImportTemplate}
              className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl border border-gray-300 bg-white font-semibold text-text-primary hover:bg-gray-50 text-sm sm:min-w-0"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              Template
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importBusy}
              className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl border border-primary bg-primary/5 text-primary font-semibold hover:bg-primary/10 text-sm disabled:opacity-50 sm:min-w-0"
            >
              <Upload className="w-4 h-4 shrink-0" />
              {importBusy ? 'Importing…' : 'Import'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImportFile}
            />
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl bg-primary text-white font-semibold hover:bg-primary-600 text-sm shadow-sm sm:min-w-0"
            >
              <Download className="w-4 h-4 shrink-0" />
              Export
            </button>
          </div>
        </details>
      </div>

      {importMsg && (
        <div className="text-sm rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-text-primary">{importMsg}</div>
      )}

      <p className="text-xs text-text-secondary -mt-2">
        Import: use the <strong>Transactions</strong> sheet; row 1 headers must be Date, Type, Amount, Category,
        Description, AccountId, SourceLoanId (same as export). Types: <code className="text-xs">income</code>,{' '}
        <code className="text-xs">expense</code>, <code className="text-xs">loan</code>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-background-card rounded-2xl p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-secondary">Income</div>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-text-primary mt-2 break-words">
            {formatCurrency(totals.income, currency)}
          </div>
        </div>
        <div className="bg-background-card rounded-2xl p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-secondary">Expense</div>
            <TrendingDown className="w-5 h-5 text-danger" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-danger mt-2 break-words">
            {formatCurrency(totals.expense, currency)}
          </div>
        </div>
        <div className="bg-background-card rounded-2xl p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div className="text-sm text-text-secondary">Loans (not income)</div>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-text-primary mt-2 break-words">
            {formatCurrency(totals.loans, currency)}
          </div>
        </div>
        <div className="bg-background-card rounded-2xl p-5 sm:p-6 shadow-soft">
          <div className="text-sm text-text-secondary">Net (Income − Expense)</div>
          <div className="text-xl sm:text-2xl font-extrabold text-text-primary mt-2 break-words">
            {formatCurrency(totals.net, currency)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseDonutChart data={expenseByCategory} />
        <DailyTrendChart data={trendMonth} />
      </div>
    </div>
  )
}

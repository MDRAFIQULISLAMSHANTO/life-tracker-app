'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Target } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { useFinance } from '../../../context/FinanceContext'
import { formatCurrency, getCurrencySymbol } from '../../../utils/formatters'
import BudgetStatus from '../../../components/dashboard/BudgetStatus'

const BudgetBarChart = dynamic(() => import('../../../components/charts/BudgetBarChart'), { ssr: false,
  loading: () => <div className="glass-card animate-pulse" style={{ height: 280 }} />,
})

export default function BudgetPage() {
  const { user, loading } = useAuth()
  const { currency, ledgerMonthKey, budgetRowsFull, setBudgetForCategory, clearBudgetForCategory } = useFinance()

  const [drafts, setDrafts] = useState({})
  const [msg, setMsg] = useState({ text: '', ok: true })

  const rows = budgetRowsFull
  const displayRows = useMemo(() =>
    rows.map((r) => ({ ...r, draft: drafts[r.category] !== undefined ? drafts[r.category] : String(r.budget || '') })),
    [rows, drafts]
  )

  const chartRows = useMemo(() => rows.filter((r) => r.budget > 0 || r.spent > 0), [rows])
  const budgetRows = useMemo(() => rows.filter((r) => r.budget > 0), [rows])

  const setMsg2 = (text, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text: '', ok: true }), 2500) }

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-2)' }}>Loading…</div>
  if (!user) return null

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold mb-3 transition-opacity hover:opacity-70" style={{ color: 'var(--text-2)' }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(var(--accent-rgb),0.1)' }}>
            <Target className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>Budgets</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>
              {ledgerMonthKey} · {getCurrencySymbol(currency)} {currency}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartRows.length > 0 && <BudgetBarChart rows={chartRows} currency={currency} />}

      {/* Progress summary */}
      {budgetRows.length > 0 && <BudgetStatus budgets={budgetRows} currency={currency} />}

      {msg.text && (
        <p className="text-sm font-semibold" style={{ color: msg.ok ? 'var(--success)' : 'var(--danger)' }}>{msg.text}</p>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden" style={{ padding: 0 }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--card-border)' }}>
          <h2 className="text-base font-extrabold" style={{ color: 'var(--text-1)' }}>Set Budget per Category</h2>
        </div>
        <div className="scroll-touch overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)' }}>
                {['Category', 'Spent', 'Budget', 'Status', ''].map((h) => (
                  <th key={h} className={`py-3 px-4 font-bold text-xs uppercase tracking-wide text-left ${h === '' ? 'text-right' : ''}`}
                    style={{ color: 'var(--text-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const pct = row.budget > 0 ? Math.min((row.spent / row.budget) * 100, 100) : 0
                const over = row.budget > 0 && row.spent > row.budget
                const barColor = over ? 'var(--danger)' : pct >= 80 ? 'var(--warning)' : 'var(--success)'
                return (
                  <tr key={row.category} style={{ borderBottom: '1px solid var(--card-border)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td className="py-3 px-4 font-semibold" style={{ color: 'var(--text-1)' }}>{row.category}</td>
                    <td className="py-3 px-4 tabular-nums whitespace-nowrap" style={{ color: over ? 'var(--danger)' : 'var(--text-2)' }}>
                      {formatCurrency(row.spent, currency)}
                    </td>
                    <td className="py-3 px-4">
                      <input type="number" min="0" step="0.01" value={row.draft}
                        onChange={(e) => setDrafts((d) => ({ ...d, [row.category]: e.target.value }))}
                        placeholder="0" className="glass-input min-h-[36px] !py-1.5 !text-sm max-w-[120px]" />
                    </td>
                    <td className="py-3 px-4" style={{ minWidth: 100 }}>
                      {row.budget > 0 ? (
                        <div>
                          <div className="progress-track" style={{ width: 80 }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <p className="text-[10px] mt-0.5 font-semibold" style={{ color: barColor }}>
                            {over ? 'Over!' : `${Math.round(pct)}%`}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--text-3)' }}>No limit</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" className="accent-btn px-3 py-1.5 text-xs min-h-[32px]"
                          onClick={() => {
                            const raw = drafts[row.category] !== undefined ? drafts[row.category] : String(row.budget || '')
                            const num = parseFloat(String(raw).replace(',', '.'))
                            if (!Number.isFinite(num) || num < 0) { setMsg2('Enter a valid budget ≥ 0.', false); return }
                            setBudgetForCategory(ledgerMonthKey, row.category, num)
                            setDrafts((d) => { const n = { ...d }; delete n[row.category]; return n })
                            setMsg2('Budget saved.')
                          }}>
                          Save
                        </button>
                        <button type="button"
                          className="px-3 py-1.5 rounded-lg text-xs font-bold min-h-[32px] transition-opacity hover:opacity-70"
                          style={{ border: '1px solid var(--card-border)', color: 'var(--text-2)' }}
                          onClick={() => {
                            clearBudgetForCategory(ledgerMonthKey, row.category)
                            setDrafts((d) => { const n = { ...d }; delete n[row.category]; return n })
                            setMsg2('Cleared.')
                          }}>
                          Clear
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'
import { useTheme } from '../../context/ThemeContext'
import { makeCategoryScale } from '../../lib/chartColors'

/**
 * Biggest spending categories this month as horizontal bars, each with its
 * change against the previous month. Bar colour follows the category (same
 * scale as the donut), so a category looks the same in every chart.
 */
export default function TopCategoriesChart({ rows = [], limit = 5 }) {
  const { theme } = useTheme()
  const { currency, expenseCategories, otherCategories } = useFinance()
  const scale = makeCategoryScale([...(expenseCategories || []), ...(otherCategories || [])], theme)
  const top = [...rows].sort((a, b) => b.value - a.value).slice(0, limit)
  const max = top[0]?.value || 0

  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div className="dashboard-glass-card h-full">
      <div className="mb-5">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Top Spending</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Change vs last month</p>
      </div>
      {top.length > 0 ? (
        <div className="space-y-3.5">
          {top.map((row) => {
            const width = max > 0 ? (row.value / max) * 100 : 0
            const delta = row.prev > 0 ? Math.round(((row.value - row.prev) / row.prev) * 100) : null
            const up = delta !== null && delta > 0
            const DeltaIcon = up ? ArrowUpRight : ArrowDownRight
            return (
              <div key={row.name}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>{row.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {delta === null ? (
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>New</span>
                    ) : delta !== 0 && (
                      <span className="flex items-center text-[11px] font-bold tabular-nums" style={{ color: up ? 'var(--danger)' : 'var(--success)' }}>
                        <DeltaIcon className="w-3 h-3" aria-hidden />
                        {Math.abs(delta)}%
                      </span>
                    )}
                    <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-1)' }}>{formatCurrency(row.value, currency)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--input-bg)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: grown ? `${width}%` : '0%',
                      background: scale(row.name),
                      transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center" style={{ height: 180, color: 'var(--text-2)' }}>
          <p className="text-sm">No expenses this month</p>
        </div>
      )}
    </div>
  )
}

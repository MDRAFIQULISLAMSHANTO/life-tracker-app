'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'
import { useTheme } from '../../context/ThemeContext'
import { foldToTopN, makeCategoryScale, otherColor } from '../../lib/chartColors'



function ExpenseDonutChart({ data = [] }) {
  const { theme } = useTheme()
  const { currency, expenseCategories, otherCategories } = useFinance()
  // Colours come from the master category list so the chart's own subset
  // can change without repainting anything.
  const scale = makeCategoryScale([...(expenseCategories || []), ...(otherCategories || [])], theme)
  // Fold the long tail so the palette is never cycled.
  const rows = foldToTopN(data, 7)
  const colorFor = (row) => (row.__isOther ? otherColor(theme) : scale(row.name))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
      return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(12px)' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, fontSize: 13 }}>{item.name}</p>
          <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>{formatCurrency(item.value, currency)}</p>
          <p style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 2 }}>{percentage}% of total</p>
        </div>
      )
    }
    return null
  }

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="dashboard-glass-card">
      <div className="mb-5">
        <h3 className="text-base font-bold mb-1" style={{ color: 'var(--text-1)' }}>Expense Breakdown</h3>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--text-2)' }}>By category</span>
          <span className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>{formatCurrency(total, currency)}</span>
        </div>
      </div>
      {rows.length > 0 ? (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="w-full lg:w-1/2 flex justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={rows.map((item) => ({ ...item, total }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={3}
                >
                  {rows.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={colorFor(entry)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 space-y-2">
            {rows.map((item) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors"
                  style={{ background: 'rgba(var(--accent-rgb),0.04)' }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorFor(item) }} />
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--text-1)' }}>{item.name}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-1)' }}>{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center" style={{ height: 200, color: 'var(--text-2)' }}>
          <p className="text-sm">No expense data yet</p>
        </div>
      )}
    </div>
  )
}

export default ExpenseDonutChart

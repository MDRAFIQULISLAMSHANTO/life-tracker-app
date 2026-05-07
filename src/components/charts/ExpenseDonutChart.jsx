'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

function ExpenseDonutChart({ data = [] }) {
  const { currency } = useFinance()

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
      {data.length > 0 ? (
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="w-full lg:w-1/2 flex justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.map(item => ({ ...item, total }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={55}
                  dataKey="value"
                  stroke="none"
                  paddingAngle={3}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full lg:w-1/2 space-y-2">
            {data.slice(0, 6).map((item, index) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors"
                  style={{ background: 'rgba(var(--accent-rgb),0.04)' }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
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

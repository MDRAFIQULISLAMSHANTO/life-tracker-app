'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'

function DailyTrendChart({ data = [] }) {
  const { currency } = useFinance()
  const code = String(currency || 'USD').toUpperCase()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(12px)' }}>
          <p style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: 8, fontSize: 12 }}>Day {label}</p>
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center gap-3 mb-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{entry.name}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', marginLeft: 'auto' }}>{formatCurrency(entry.value, currency)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="dashboard-glass-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-2">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Monthly Cashflow</h3>
        <div className="flex items-center gap-4">
          {[{ color: 'var(--accent)', label: 'Income' }, { color: '#ef4444', label: 'Expense' }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--text-3)"
              tick={{ fill: 'var(--text-3)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-3)"
              tick={{ fill: 'var(--text-3)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => {
                const n = Number(v)
                if (n >= 1000) return `${(n / 1000).toFixed(0)}k`
                return String(n)
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="var(--accent)"
              strokeWidth={2}
              fill="url(#gradIncome)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="Expense"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#gradExpense)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center" style={{ height: 200, color: 'var(--text-2)' }}>
          <p className="text-sm">No cashflow data yet</p>
        </div>
      )}
    </div>
  )
}

export default DailyTrendChart

'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { useTheme } from '../../context/ThemeContext'
import { moneyColors } from '../../lib/chartColors'

const shortMoney = (v) => {
  const n = Math.abs(Number(v))
  if (n >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (n >= 1000) return `${(v / 1000).toFixed(0)}k`
  return String(v)
}

function TrendTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', borderRadius: 12, padding: '10px 14px', minWidth: 170 }}>
      <p style={{ fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, fontSize: 12 }}>{row.fullLabel || label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{p.name}</span>
          <span className="tabular-nums" style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)', marginLeft: 'auto' }}>
            {formatCurrency(p.value, currency)}
          </span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-1.5 pt-1.5" style={{ borderTop: '1px solid var(--card-border)' }}>
        <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Net</span>
        <span className="tabular-nums" style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-1)', marginLeft: 'auto' }}>
          {formatCurrency(row.income - row.expense, currency)}
        </span>
      </div>
    </div>
  )
}

/** Income vs expense for the last few months, ending at the viewed month. */
export default function MonthlyTrendChart({ data = [], currency }) {
  const { theme } = useTheme()
  const C = moneyColors(theme)
  const hasData = data.some((d) => d.income > 0 || d.expense > 0)

  return (
    <div className="dashboard-glass-card">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-2">
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>6-Month Trend</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Income vs expense by month</p>
        </div>
        <div className="flex items-center gap-4">
          {[{ color: C.income, label: 'Income' }, { color: C.expense, label: 'Expense' }].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-xs" style={{ color: 'var(--text-2)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      {hasData ? (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 600 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} tickLine={false} axisLine={false} width={40} tickFormatter={shortMoney} />
            <Tooltip content={<TrendTooltip currency={currency} />} cursor={{ fill: 'rgba(var(--accent-rgb),0.06)' }} />
            <Bar dataKey="income" name="Income" fill={C.income} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="expense" name="Expense" fill={C.expense} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center" style={{ height: 200, color: 'var(--text-2)' }}>
          <p className="text-sm">No history yet</p>
        </div>
      )}
    </div>
  )
}

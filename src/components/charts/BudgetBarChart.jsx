'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from '../../utils/formatters'

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs shadow-lg" style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', minWidth: 160 }}>
      <p className="font-bold mb-1.5" style={{ color: 'var(--text-1)' }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: 'var(--text-2)' }}>{p.name}</span>
          <span className="font-bold tabular-nums" style={{ color: p.fill || p.color }}>{formatCurrency(p.value, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export default function BudgetBarChart({ rows = [], currency }) {
  const data = rows
    .filter((r) => r.budget > 0 || r.spent > 0)
    .map((r) => ({
      name: r.category.length > 12 ? r.category.slice(0, 12) + '…' : r.category,
      Budget: r.budget || 0,
      Spent: r.spent || 0,
      over: r.spent > r.budget && r.budget > 0,
    }))

  if (!data.length) return null

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-extrabold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Budget vs Actual</h3>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'rgba(var(--accent-rgb),0.6)' }} />Budget</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: 'var(--danger)' }} />Spent</span>
        </div>
      </div>
      <div className="scroll-touch overflow-x-auto">
      <ResponsiveContainer width={Math.max(data.length * 80, 300)} height={260}>
        <BarChart data={data} barGap={4} barCategoryGap="30%" width={Math.max(data.length * 80, 300)}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 600 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={40}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
          <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(var(--accent-rgb),0.05)' }} />
          <Bar dataKey="Budget" radius={[4, 4, 0, 0]} fill="rgba(var(--accent-rgb),0.5)" />
          <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.over ? 'var(--danger)' : 'var(--success)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}

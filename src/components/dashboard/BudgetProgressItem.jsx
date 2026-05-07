import { formatCurrency } from '../../utils/formatters'

function BudgetProgressItem({ category, spent, budget, currency = 'BDT' }) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0
  const pct = Math.min(percentage, 100)

  const fillColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e'
  const textColor = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e'

  return (
    <div
      className="py-3.5 last:pb-0"
      style={{ borderBottom: '1px solid var(--card-border)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{category}</span>
        <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-2)' }}>
          {formatCurrency(spent, currency)} / {formatCurrency(budget, currency)}
        </span>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: fillColor }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <span className="text-xs" style={{ color: 'var(--text-3)' }}>
          {formatCurrency(Math.max(budget - spent, 0), currency)} left
        </span>
        <span className="text-xs font-bold" style={{ color: textColor }}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

export default BudgetProgressItem

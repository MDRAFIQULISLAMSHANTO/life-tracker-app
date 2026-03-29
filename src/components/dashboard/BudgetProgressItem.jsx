import { formatCurrency } from '../../utils/formatters'

function BudgetProgressItem({ category, spent, budget, currency = 'BDT' }) {
  const percentage = budget > 0 ? (spent / budget) * 100 : 0
  
  let progressColor = 'bg-success'
  if (percentage >= 90) {
    progressColor = 'bg-danger'
  } else if (percentage >= 70) {
    progressColor = 'bg-warning'
  }

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-text-primary">{category}</h4>
        <span className="text-sm font-medium text-text-secondary">
          {formatCurrency(spent, currency)} / {formatCurrency(budget, currency)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ${progressColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-text-secondary">
          {formatCurrency(budget - spent, currency)} remaining
        </span>
        <span className={`text-xs font-medium ${
          percentage >= 90 ? 'text-danger' : 
          percentage >= 70 ? 'text-warning' : 
          'text-success'
        }`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

export default BudgetProgressItem

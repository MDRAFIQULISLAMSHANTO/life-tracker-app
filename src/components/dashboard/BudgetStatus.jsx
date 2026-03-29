'use client'

import Link from 'next/link'
import BudgetProgressItem from './BudgetProgressItem'

function BudgetStatus({ budgets = [], currency }) {
  return (
    <div className="dashboard-glass-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Budget Status</h3>
        <Link
          href="/dashboard/budget"
          className="text-sm text-primary font-medium hover:text-primary-600 transition-colors"
        >
          Edit budgets
        </Link>
      </div>
      {budgets.length > 0 ? (
        <div className="space-y-2">
          {budgets.map((budget) => (
            <BudgetProgressItem key={budget.category} {...budget} currency={currency} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <p className="text-sm mb-2">No budget data for this month yet</p>
          <Link href="/dashboard/budget" className="text-sm text-primary font-medium hover:text-primary-600 transition-colors">
            Set category budgets
          </Link>
        </div>
      )}
    </div>
  )
}

export default BudgetStatus

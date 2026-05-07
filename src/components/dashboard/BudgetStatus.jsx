'use client'

import Link from 'next/link'
import BudgetProgressItem from './BudgetProgressItem'

function BudgetStatus({ budgets = [], currency }) {
  return (
    <div className="dashboard-glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Budget Status</h3>
        <Link
          href="/dashboard/budget"
          className="text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          Edit budgets
        </Link>
      </div>
      {budgets.length > 0 ? (
        <div>
          {budgets.map((b) => (
            <BudgetProgressItem key={b.category} {...b} currency={currency} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-3)' }}>
          <p className="text-sm mb-2">No budgets set for this month</p>
          <Link href="/dashboard/budget" className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
            Set budgets →
          </Link>
        </div>
      )}
    </div>
  )
}

export default BudgetStatus

'use client'

import { ArrowDownCircle, ArrowUpCircle, FileText, Calendar } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { useFinance } from '../../context/FinanceContext'

const activityIcons = {
  income: ArrowUpCircle,
  expense: ArrowDownCircle,
  note: FileText,
  event: Calendar,
}

const activityColors = {
  income: 'text-success bg-green-100',
  expense: 'text-danger bg-red-100',
  note: 'text-primary bg-primary-100',
  event: 'text-warning bg-yellow-100',
}

function RecentActivityItem({ activity }) {
  // Sample data structure: { type: 'expense', title: 'Grocery Shopping', amount: -150, time: '2 hours ago', category: 'Food' }
  const { currency } = useFinance()
  
  const Icon = activityIcons[activity.type] || FileText
  const iconColor = activityColors[activity.type] || 'text-text-secondary bg-gray-100'

  return (
    <div className="flex items-start space-x-4 py-4 border-b border-gray-100 last:border-b-0">
      <div className={`flex-shrink-0 w-10 h-10 ${iconColor} rounded-xl flex items-center justify-center`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-text-primary truncate">{activity.title}</p>
          {activity.amount && (
            <span className={`text-sm font-semibold ml-2 ${
              activity.amount >= 0 ? 'text-success' : 'text-danger'
            }`}>
              {activity.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(activity.amount), currency)}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-xs text-text-secondary">
          {activity.category && (
            <>
              <span>{activity.category}</span>
              <span>•</span>
            </>
          )}
          <span>{activity.time}</span>
        </div>
      </div>
    </div>
  )
}

export default RecentActivityItem

'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

function SummaryCard({ title, value, change, changeType, icon: Icon, iconColor = 'primary', accent }) {
  const isPositive = changeType === 'positive'
  const isNegative = changeType === 'negative'

  const iconStyles = {
    primary: { bg: 'rgba(var(--accent-rgb), 0.12)', color: 'var(--accent)' },
    success: { bg: 'rgba(34, 197, 94, 0.12)', color: '#22c55e' },
    danger: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
    warning: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
  }
  const iconStyle = iconStyles[iconColor] || iconStyles.primary
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : null
  const trendColor = isPositive ? '#22c55e' : isNegative ? '#ef4444' : 'var(--text-2)'

  return (
    <div className="glass-card h-full transition-all duration-200 hover:-translate-y-0.5" style={{ padding: '1.25rem' }}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: iconStyle.bg }}
        >
          {Icon && <Icon className="h-5 w-5" style={{ color: iconStyle.color }} aria-hidden />}
        </div>
        {change && (
          <div className="flex items-center gap-1 text-right">
            {TrendIcon && <TrendIcon className="h-3 w-3 shrink-0" style={{ color: trendColor }} />}
            <span className="text-[10px] font-semibold" style={{ color: trendColor }}>{change}</span>
          </div>
        )}
      </div>
      <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-2)' }}>{title}</p>
      <p className="text-base sm:text-xl font-bold tabular-nums tracking-tight truncate" style={{ color: 'var(--text-1)' }}>{value}</p>
    </div>
  )
}

export default SummaryCard

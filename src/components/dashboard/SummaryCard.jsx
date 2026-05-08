'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

function SummaryCard({ title, value, change, changeType, icon: Icon }) {
  const isPositive = changeType === 'positive'
  const isNegative = changeType === 'negative'
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : null
  const trendColor = isPositive ? '#10b981' : isNegative ? '#f43f5e' : 'var(--text-3)'

  return (
    <div
      className="glass-card h-full transition-all duration-200"
      style={{ padding: '1.1rem' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = '' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}
        >
          {Icon && <Icon className="h-4 w-4" style={{ color: 'var(--text-2)' }} aria-hidden />}
        </div>
        {change && (
          <div className="flex items-center gap-1 text-right">
            {TrendIcon && <TrendIcon className="h-3 w-3 shrink-0" style={{ color: trendColor }} />}
            <span className="text-[10px] font-bold" style={{ color: trendColor }}>{change}</span>
          </div>
        )}
      </div>
      <p className="text-[10px] font-bold mb-1 uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{title}</p>
      <p className="text-base sm:text-lg font-extrabold tabular-nums tracking-tight truncate" style={{ color: 'var(--text-1)' }}>{value}</p>
    </div>
  )
}

export default SummaryCard

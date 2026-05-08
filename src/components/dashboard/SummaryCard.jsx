'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

const CARD_THEMES = {
  primary: {
    grad: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    glow: 'rgba(99,102,241,0.22)',
    border: 'rgba(99,102,241,0.25)',
  },
  success: {
    grad: 'linear-gradient(135deg, #10b981, #059669)',
    glow: 'rgba(16,185,129,0.22)',
    border: 'rgba(16,185,129,0.25)',
  },
  danger: {
    grad: 'linear-gradient(135deg, #f43f5e, #dc2626)',
    glow: 'rgba(244,63,94,0.22)',
    border: 'rgba(244,63,94,0.25)',
  },
  warning: {
    grad: 'linear-gradient(135deg, #f59e0b, #d97706)',
    glow: 'rgba(245,158,11,0.22)',
    border: 'rgba(245,158,11,0.25)',
  },
}

function SummaryCard({ title, value, change, changeType, icon: Icon, iconColor = 'primary' }) {
  const isPositive = changeType === 'positive'
  const isNegative = changeType === 'negative'
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : null
  const trendColor = isPositive ? '#10b981' : isNegative ? '#f43f5e' : 'var(--text-2)'

  const { grad, glow, border } = CARD_THEMES[iconColor] || CARD_THEMES.primary

  return (
    <div
      className="glass-card h-full transition-all duration-200"
      style={{
        padding: '1.25rem',
        borderTop: `2px solid ${border}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = `var(--card-shadow), 0 8px 24px ${glow}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{
            background: grad,
            boxShadow: `0 4px 14px ${glow}`,
          }}
        >
          {Icon && <Icon className="h-5 w-5 text-white" aria-hidden />}
        </div>
        {change && (
          <div className="flex items-center gap-1 text-right">
            {TrendIcon && <TrendIcon className="h-3 w-3 shrink-0" style={{ color: trendColor }} />}
            <span className="text-[10px] font-bold" style={{ color: trendColor }}>{change}</span>
          </div>
        )}
      </div>
      <p className="text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>{title}</p>
      <p className="text-base sm:text-xl font-extrabold tabular-nums tracking-tight truncate" style={{ color: 'var(--text-1)' }}>{value}</p>
    </div>
  )
}

export default SummaryCard

'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { usePrivacy } from '../../context/PrivacyContext'

/**
 * `sensitive` values are masked while the wallet's eye is closed, so the summary
 * row can't leak the figures the wallet card is hiding.
 */
function Sparkline({ points, color }) {
  const W = 100
  const H = 28
  const max = Math.max(...points, 0)
  const min = Math.min(...points, 0)
  if (points.length < 2 || max === min) return null
  const step = W / (points.length - 1)
  const xy = points.map((v, i) => [i * step, H - 2 - ((v - min) / (max - min)) * (H - 4)])
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const id = `spark-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full mt-2" style={{ height: 28 }} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/**
 * `spark` is an optional series (e.g. cumulative daily totals) drawn as a tiny
 * area under the value. It carries shape only — no figures — so it stays
 * visible while the value itself is masked.
 */
function SummaryCard({ title, value, change, changeType, icon: Icon, sensitive = true, spark, sparkColor = 'var(--accent)' }) {
  const { mask } = usePrivacy()
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
          {Icon && <Icon className="h-4 w-4" style={{ color: spark ? sparkColor : 'var(--text-2)' }} aria-hidden />}
        </div>
        {change && (
          <div className="flex items-center gap-1 text-right">
            {TrendIcon && <TrendIcon className="h-3 w-3 shrink-0" style={{ color: trendColor }} />}
            <span className="text-[10px] font-bold" style={{ color: trendColor }}>{change}</span>
          </div>
        )}
      </div>
      <p className="text-[10px] font-bold mb-1 uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>{title}</p>
      <p className="text-base sm:text-lg font-extrabold tabular-nums tracking-tight truncate" style={{ color: 'var(--text-1)' }}>{sensitive ? mask(value) : value}</p>
      {spark && <Sparkline points={spark} color={sparkColor} />}
    </div>
  )
}

export default SummaryCard

'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { CATEGORICAL, chartMode } from '../../lib/chartColors'

const SIZE = 92
const STROKE = 9
const R = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * R

function Ring({ pct, color, center, label, sub }) {
  // Start empty and fill on mount so the ring sweeps in.
  const [shown, setShown] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.max(0, Math.min(100, pct))))
    return () => cancelAnimationFrame(id)
  }, [pct])

  return (
    <div className="flex flex-col items-center text-center min-w-0">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--input-bg)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none"
            stroke={color} strokeWidth={STROKE} strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - shown / 100)}
            style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-extrabold tabular-nums tracking-tight" style={{ color: 'var(--text-1)' }}>{center}</span>
        </div>
      </div>
      <p className="mt-2 text-xs font-bold" style={{ color: 'var(--text-1)' }}>{label}</p>
      <p className="text-[11px] mt-0.5 truncate max-w-full" style={{ color: 'var(--text-2)' }}>{sub}</p>
    </div>
  )
}

/**
 * Three at-a-glance ratios for the viewed month. Colours are fixed categorical
 * slots (amber, green, pink) so each ring keeps its hue; an overspent budget
 * switches to the reserved danger colour and says so in words, not colour alone.
 */
export default function InsightRings({ savingsRate, budgetUsed, totalBudget, monthProgress, dayLabel }) {
  const { theme } = useTheme()
  const P = CATEGORICAL[chartMode(theme)]
  const over = totalBudget > 0 && budgetUsed > 100

  return (
    <div className="dashboard-glass-card h-full">
      <div className="mb-5">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Month at a Glance</h3>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-2)' }}>Savings, budget and time used</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Ring
          pct={savingsRate}
          color={P[3]}
          center={`${Math.max(0, Math.round(savingsRate))}%`}
          label="Saved"
          sub={savingsRate >= 20 ? 'On track' : savingsRate > 0 ? 'Below 20%' : 'Nothing saved'}
        />
        <Ring
          pct={totalBudget > 0 ? budgetUsed : 0}
          color={over ? 'var(--danger)' : P[2]}
          center={totalBudget > 0 ? `${Math.round(budgetUsed)}%` : '—'}
          label="Budget"
          sub={totalBudget > 0 ? (over ? 'Over budget' : 'Used') : 'Not set'}
        />
        <Ring
          pct={monthProgress}
          color={P[4]}
          center={`${Math.round(monthProgress)}%`}
          label="Month"
          sub={dayLabel}
        />
      </div>
    </div>
  )
}

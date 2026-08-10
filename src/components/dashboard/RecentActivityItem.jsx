'use client'

import { ArrowDownCircle, ArrowUpCircle, FileText, Calendar, ArrowLeftRight } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import { MASK, usePrivacy } from '../../context/PrivacyContext'
import { useFinance } from '../../context/FinanceContext'

const CONFIG = {
  income:   { Icon: ArrowUpCircle,    bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  expense:  { Icon: ArrowDownCircle,  bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
  transfer: { Icon: ArrowLeftRight,   bg: 'rgba(var(--accent-rgb,99,102,241),0.12)', color: 'var(--accent)' },
  note:     { Icon: FileText,         bg: 'rgba(var(--accent-rgb,99,102,241),0.10)', color: 'var(--accent)' },
  event:    { Icon: Calendar,         bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
}

function RecentActivityItem({ activity }) {
  const { currency } = useFinance()
  const { revealed } = usePrivacy()
  const cfg = CONFIG[activity.type] || CONFIG.note
  const { Icon } = cfg

  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: '1px solid var(--card-border)' }}
    >
      <div
        className="icon-circle shrink-0"
        style={{ background: cfg.bg }}
      >
        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
          {activity.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
          {activity.category && <span>{activity.category} · </span>}
          {activity.time}
        </p>
      </div>

      {activity.amount != null && (
        <span
          className="text-sm font-bold tabular-nums shrink-0"
          style={{ color: activity.amount >= 0 ? '#22c55e' : '#ef4444' }}
        >
          {revealed ? `${activity.amount >= 0 ? '+' : ''}${formatCurrency(Math.abs(activity.amount), currency)}` : MASK}
        </span>
      )}
    </div>
  )
}

export default RecentActivityItem

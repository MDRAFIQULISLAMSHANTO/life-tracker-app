import { TrendingUp, TrendingDown } from 'lucide-react'

function SummaryCard({ title, value, change, changeType, icon: Icon, iconColor = 'primary' }) {
  const isNeutral = changeType === 'neutral'
  const isPositive = changeType === 'positive'
  const changeColor = isNeutral ? 'text-text-secondary' : isPositive ? 'text-success' : 'text-danger'
  const TrendIcon = isNeutral ? null : isPositive ? TrendingUp : TrendingDown

  const iconColors = {
    primary: 'bg-sea-100 text-sea-800',
    success: 'bg-emerald-100 text-emerald-800',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-amber-100 text-amber-800',
  }

  return (
    <div className="dashboard-glass-card h-full !p-4 transition-shadow hover:shadow-glass sm:!p-6 lg:hover:shadow-glass-lg">
      <div className="mb-2 flex items-center justify-between max-sm:mb-2 sm:mb-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${iconColors[iconColor]}`}
        >
          {Icon && <Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden />}
        </div>
        {change && (
          <div className={`flex max-w-[48%] items-center justify-end gap-0.5 text-right ${changeColor}`}>
            {TrendIcon && <TrendIcon className="hidden h-3.5 w-3.5 shrink-0 sm:block sm:h-4 sm:w-4" aria-hidden />}
            <span className="text-[10px] font-semibold leading-tight sm:text-sm sm:font-medium">{change}</span>
          </div>
        )}
      </div>
      <h3 className="mb-0.5 line-clamp-2 text-xs font-medium leading-snug text-text-secondary sm:mb-1 sm:line-clamp-none sm:text-sm">
        {title}
      </h3>
      <p className="break-words text-lg font-bold tabular-nums tracking-tight text-text-primary sm:text-2xl">{value}</p>
    </div>
  )
}

export default SummaryCard



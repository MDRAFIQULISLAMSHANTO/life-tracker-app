'use client'

import Link from 'next/link'
import RecentActivityItem from './RecentActivityItem'

function RecentActivity({ activities = [] }) {
  return (
    <div className="dashboard-glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>Recent Activity</h3>
        <Link
          href="/dashboard/ledger"
          className="text-xs font-bold transition-opacity hover:opacity-70"
          style={{ color: 'var(--accent)' }}
        >
          View all
        </Link>
      </div>
      {activities.length > 0 ? (
        <div className="scroll-touch max-h-96 overflow-y-auto -mx-1 px-1">
          {activities.map((a) => (
            <RecentActivityItem key={a.id || `${a.title}-${a.time}`} activity={a} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-3)' }}>
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  )
}

export default RecentActivity

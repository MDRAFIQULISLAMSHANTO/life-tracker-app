'use client'

import RecentActivityItem from './RecentActivityItem'

function RecentActivity({ activities = [] }) {
  // Sample data structure: array of activity objects

  return (
    <div className="dashboard-glass-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text-primary">Recent Activity</h3>
        <button className="text-sm text-primary font-medium hover:text-primary-600 transition-colors">
          View All
        </button>
      </div>
      {activities.length > 0 ? (
        <div className="max-h-96 overflow-y-auto scrollbar-hide">
          {activities.map((activity) => (
            <RecentActivityItem key={activity.id || `${activity.title}-${activity.time}`} activity={activity} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-text-secondary">
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  )
}

export default RecentActivity



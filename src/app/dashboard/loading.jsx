export default function DashboardLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-48 animate-pulse rounded-xl" style={{ background: 'var(--input-bg)' }} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl"
            style={{ height: 96, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl"
            style={{ height: 260, background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
          />
        ))}
      </div>
    </div>
  )
}

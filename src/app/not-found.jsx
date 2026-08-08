import Link from 'next/link'

export const metadata = { title: 'Page not found' }

export default function NotFound() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: 'var(--bg)', color: 'var(--text-1)' }}
    >
      <p className="text-5xl font-extrabold tracking-tight" style={{ color: 'var(--accent)' }}>
        404
      </p>
      <h1 className="text-2xl font-extrabold tracking-tight">This page doesn’t exist</h1>
      <p className="max-w-sm text-sm" style={{ color: 'var(--text-2)' }}>
        The link may be out of date. Everything lives under the dashboard.
      </p>
      <Link href="/dashboard" className="accent-btn mt-2 px-6 py-3">
        Go to dashboard
      </Link>
    </div>
  )
}

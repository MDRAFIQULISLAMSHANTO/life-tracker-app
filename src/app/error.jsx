'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[Livio] unhandled error', error)
  }, [error])

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: 'var(--bg)', color: 'var(--text-1)' }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-3xl"
        style={{ background: 'rgba(var(--danger-rgb),0.12)', color: 'var(--danger)' }}
      >
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">Something broke</h1>
      <p className="max-w-sm text-sm" style={{ color: 'var(--text-2)' }}>
        Your data is safe — it’s stored on the device and in your account. Try again, and if it keeps
        happening, reload the page.
      </p>
      {error?.digest && (
        <p className="text-xs tabular-nums" style={{ color: 'var(--text-3)' }}>
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={reset} className="accent-btn px-6 py-3">
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.location.assign('/dashboard')}
          className="rounded-xl px-6 py-3 text-sm font-bold"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-1)' }}
        >
          Go to dashboard
        </button>
      </div>
    </div>
  )
}

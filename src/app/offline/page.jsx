import Link from 'next/link'
import { WifiOff } from 'lucide-react'

export const metadata = { title: 'Offline' }

export default function OfflinePage() {
  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: 'var(--bg)', color: 'var(--text-1)' }}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-3xl"
        style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent)' }}
      >
        <WifiOff className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">You’re offline</h1>
      <p className="max-w-sm text-sm" style={{ color: 'var(--text-2)' }}>
        Livio keeps your data on the device, so anything you already opened still works.
        New changes sync as soon as you’re back online.
      </p>
      <Link href="/dashboard" className="accent-btn mt-2 px-6 py-3">
        Back to dashboard
      </Link>
    </main>
  )
}

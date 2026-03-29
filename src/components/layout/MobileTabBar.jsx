'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PieChart, Plus, User } from 'lucide-react'
import { useQuickAdd } from '../../context/QuickAddContext'

export default function MobileTabBar() {
  const pathname = usePathname() || ''
  const { openQuickAdd } = useQuickAdd()

  const isHome =
    pathname === '/dashboard' ||
    (pathname.startsWith('/dashboard/') &&
      !pathname.startsWith('/dashboard/reports') &&
      !pathname.startsWith('/dashboard/settings'))
  const isReports = pathname.startsWith('/dashboard/reports')
  const isSettings = pathname.startsWith('/dashboard/settings')

  const btnBase =
    'flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95'
  const active = 'bg-sea-600 text-white shadow-md shadow-sea-600/25'
  const idle = 'text-neutral-600 active:bg-white/55'

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-center gap-2 px-3 pt-2 lg:hidden"
      style={{ paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-white/55 bg-white/40 px-1.5 py-1.5 shadow-dock backdrop-blur-2xl"
        aria-label="Main"
      >
        <Link
          href="/dashboard"
          className={`${btnBase} ${isHome ? active : idle}`}
          aria-current={isHome ? 'page' : undefined}
        >
          <Home className="h-5 w-5" strokeWidth={isHome ? 2.4 : 2} aria-hidden />
        </Link>
        <Link
          href="/dashboard/reports"
          className={`${btnBase} ${isReports ? active : idle}`}
          aria-current={isReports ? 'page' : undefined}
        >
          <PieChart className="h-5 w-5" strokeWidth={isReports ? 2.4 : 2} aria-hidden />
        </Link>
        <Link
          href="/dashboard/settings"
          className={`${btnBase} ${isSettings ? active : idle}`}
          aria-current={isSettings ? 'page' : undefined}
        >
          <User className="h-5 w-5" strokeWidth={isSettings ? 2.4 : 2} aria-hidden />
        </Link>
      </nav>
      <button
        type="button"
        onClick={openQuickAdd}
        className="pointer-events-auto ml-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sea-600 text-white shadow-fab transition-colors hover:bg-sea-700 active:scale-95"
        aria-label="Quick add income or expense"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  )
}

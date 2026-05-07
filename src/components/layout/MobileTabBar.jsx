'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, PieChart, Plus, User } from 'lucide-react'
import { useQuickAdd } from '../../context/QuickAddContext'

export default function MobileTabBar() {
  const pathname = usePathname() || ''
  const { openQuickAdd } = useQuickAdd()

  const isHome = pathname === '/dashboard' || (pathname.startsWith('/dashboard/') && !pathname.startsWith('/dashboard/reports') && !pathname.startsWith('/dashboard/settings'))
  const isReports = pathname.startsWith('/dashboard/reports')
  const isSettings = pathname.startsWith('/dashboard/settings')

  const tabs = [
    { href: '/dashboard', icon: Home, active: isHome },
    { href: '/dashboard/reports', icon: PieChart, active: isReports },
    { href: '/dashboard/settings', icon: User, active: isSettings },
  ]

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-end justify-center gap-3 px-4 pt-2 lg:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        className="pointer-events-auto flex items-center gap-1 rounded-2xl px-2 py-2 shadow-dock"
        style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--card-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
        aria-label="Main"
      >
        {tabs.map(({ href, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            className="flex h-11 w-11 items-center justify-center rounded-xl transition-all active:scale-95"
            style={active
              ? { background: 'var(--accent)', color: 'white', boxShadow: '0 4px 12px rgba(var(--accent-rgb),0.3)' }
              : { color: 'var(--text-2)' }
            }
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} aria-hidden />
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={openQuickAdd}
        className="pointer-events-auto flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white transition-all active:scale-95"
        style={{ background: 'var(--accent)', boxShadow: '0 8px 24px rgba(var(--accent-rgb),0.4)' }}
        aria-label="Quick add"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} aria-hidden />
      </button>
    </div>
  )
}

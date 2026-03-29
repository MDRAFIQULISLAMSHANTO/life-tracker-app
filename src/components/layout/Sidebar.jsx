'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '../common/Logo'
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  FileText,
  Target,
  Settings,
  HelpCircle,
  X,
  Activity,
  PieChart,
  Landmark,
} from 'lucide-react'

const navGroups = [
  {
    label: 'Overview',
    items: [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }],
  },
  {
    label: 'Money',
    items: [
      { icon: Wallet, label: 'Accounts', path: '/dashboard/accounts' },
      { icon: TrendingUp, label: 'Income', path: '/dashboard/income' },
      { icon: TrendingDown, label: 'Expenses', path: '/dashboard/expenses' },
      { icon: Landmark, label: 'Loans', path: '/dashboard/loans' },
      { icon: PieChart, label: 'Budget', path: '/dashboard/budget' },
    ],
  },
  {
    label: 'More',
    items: [
      { icon: Activity, label: 'Trackers', path: '/dashboard/trackers' },
      { icon: Target, label: 'Goals', path: '/dashboard/goals' },
      { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
    ],
  },
]

function Sidebar({ isOpen, onToggle }) {
  const pathname = usePathname()

  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onToggle()
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/25 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex h-[100dvh] min-h-0 w-[min(100vw-2rem,16rem)] max-w-[85vw]
          transform flex-col border-r transition-transform duration-300 ease-out sm:w-64
          max-lg:border-white/35 max-lg:bg-white/88 max-lg:shadow-2xl max-lg:backdrop-blur-2xl
          lg:border-sea-900/10 lg:bg-white/72 lg:shadow-[0_8px_40px_-14px_rgba(15,23,42,0.1)] lg:backdrop-blur-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:h-full
        `}
      >
        <div className="flex items-center justify-between border-b border-neutral-200/80 px-4 py-5 max-lg:border-white/40 sm:px-5 lg:border-sea-900/8">
          <div className="flex items-center">
            <Logo variant="icon" size="md" className="text-text-primary" />
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="lg:hidden rounded-lg p-2 hover:bg-neutral-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary/80">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={handleNavClick}
                      className={`
                        flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 active:scale-[0.99]
                        ${isActive
                          ? 'bg-sea-600 text-white shadow-md shadow-sea-600/20'
                          : 'text-text-secondary hover:bg-white/55 hover:text-text-primary lg:hover:bg-white/45'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-neutral-200/90 p-3 lg:border-sea-900/8">
          <Link
            href="/dashboard/settings"
            onClick={handleNavClick}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-text-secondary transition-colors hover:bg-white/55 hover:text-text-primary lg:hover:bg-white/45"
          >
            <Settings className="h-5 w-5 shrink-0" aria-hidden />
            <span className="font-medium">Settings</span>
          </Link>
          <Link
            href="/contact"
            onClick={handleNavClick}
            className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-text-secondary transition-colors hover:bg-white/55 hover:text-text-primary lg:hover:bg-white/45"
          >
            <HelpCircle className="h-5 w-5 shrink-0" aria-hidden />
            <span className="font-medium">Help</span>
          </Link>
        </div>
      </aside>
    </>
  )
}

export default Sidebar

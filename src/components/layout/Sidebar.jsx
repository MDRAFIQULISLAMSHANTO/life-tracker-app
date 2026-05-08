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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex h-[100dvh] min-h-0
          w-[min(100vw-2rem,16rem)] max-w-[85vw]
          transform flex-col transition-transform duration-300 ease-out sm:w-64
          glass-sidebar border-r border-glass lg:h-full
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ borderColor: 'var(--card-border)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 sm:px-5" style={{ borderBottom: '1px solid var(--card-border)' }}>
          <Logo height={26} />
          <button
            type="button"
            onClick={onToggle}
            className="lg:hidden rounded-xl p-2 transition-colors"
            style={{ color: 'var(--text-2)' }}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="scroll-touch min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
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
                      className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 active:scale-[0.98] ${
                        isActive ? 'nav-item-active' : 'nav-item-idle'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="font-semibold text-sm">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom links */}
        <div className="space-y-0.5 p-3 lg:p-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          {[
            { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
            { icon: HelpCircle, label: 'Help', path: '/contact' },
          ].map(({ icon: Icon, label, path }) => {
            const isActive = pathname === path
            return (
              <Link
                key={path}
                href={path}
                onClick={handleNavClick}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 ${
                  isActive ? 'nav-item-active' : 'nav-item-idle'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className="font-semibold text-sm">{label}</span>
              </Link>
            )
          })}
        </div>
      </aside>
    </>
  )
}

export default Sidebar

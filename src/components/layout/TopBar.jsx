'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, ChevronDown, Menu, LogOut, Sun, Moon, Cloud } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useFinance } from '../../context/FinanceContext'
import { getCurrencySymbol } from '../../utils/formatters'
import { useQuickAdd } from '../../context/QuickAddContext'
import { useTheme } from '../../context/ThemeContext'

function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    const { error } = await logout()
    if (!error) router.replace('/login')
    else setLoading(false)
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex min-h-[44px] w-full items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
      style={{ color: 'var(--danger, #ef4444)' }}
    >
      <LogOut className="w-4 h-4" />
      <span>{loading ? 'Logging out…' : 'Logout'}</span>
    </button>
  )
}

function TopBar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const { user } = useAuth()
  const { currency, ledgerMonthKey, shiftLedgerMonth } = useFinance()
  const { openQuickAdd } = useQuickAdd()
  const { theme, toggleTheme } = useTheme()

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ]

  const [y, m] = (ledgerMonthKey || '').split('-').map(Number)
  const labelMonth = Number.isFinite(m) ? m - 1 : new Date().getMonth()
  const labelYear = Number.isFinite(y) ? y : new Date().getFullYear()

  const initials = user?.email ? user.email[0].toUpperCase() : 'U'

  return (
    <header
      className="glass-topbar border-b px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 sm:py-3.5 lg:px-6"
      style={{ borderColor: 'var(--card-border)' }}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {/* Left */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="flex-shrink-0 rounded-xl p-2 transition-colors lg:hidden"
            style={{ color: 'var(--text-2)' }}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Month selector */}
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-xl" style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
            <button
              onClick={() => shiftLedgerMonth(-1)}
              className="rounded-lg p-1 transition-colors hover:opacity-70"
              style={{ color: 'var(--text-2)' }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span suppressHydrationWarning className="min-w-[80px] sm:min-w-[120px] text-center text-xs font-bold tracking-tight" style={{ color: 'var(--text-1)' }}>
              <span suppressHydrationWarning className="hidden sm:inline">{monthNames[labelMonth]}</span>
              <span suppressHydrationWarning className="sm:hidden">{monthNames[labelMonth].slice(0, 3)}</span>
              {' '}{labelYear}
            </span>
            <button
              onClick={() => shiftLedgerMonth(1)}
              className="rounded-lg p-1 transition-colors hover:opacity-70"
              style={{ color: 'var(--text-2)' }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user && (
            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(var(--accent-rgb),0.1)', color: 'var(--accent)', border: '1px solid rgba(var(--accent-rgb),0.2)' }}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Synced</span>
            </div>
          )}

          {/* Currency */}
          <div
            className="flex items-center px-3 py-1.5 rounded-xl text-xs font-bold tabular-nums"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-1)' }}
          >
            {getCurrencySymbol(currency)}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-9 h-9 rounded-xl transition-all"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-2)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Quick add */}
          <button
            onClick={openQuickAdd}
            className="accent-btn hidden lg:flex items-center justify-center w-9 h-9"
            aria-label="Quick add"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition-colors"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm text-white"
                style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #000))' }}
              >
                {initials}
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 sm:block" style={{ color: 'var(--text-2)' }} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                <div
                  className="absolute right-0 z-20 mt-2 w-52 rounded-2xl p-2 shadow-lg"
                  style={{ background: 'var(--surface)', border: '1px solid var(--card-border)', backdropFilter: 'blur(20px)' }}
                >
                  {user && (
                    <div className="px-3 py-2 mb-1">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-2)' }}>{user.email}</p>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid var(--card-border)' }}>
                    <LogoutButton />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar

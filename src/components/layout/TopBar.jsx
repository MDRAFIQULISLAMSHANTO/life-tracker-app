'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, ChevronDown, Menu, LogOut, Cloud } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useFinance } from '../../context/FinanceContext'
import { getCurrencySymbol } from '../../utils/formatters'
import { useQuickAdd } from '../../context/QuickAddContext'

function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    const { error } = await logout()
    if (!error) {
      // Redirect to login after logout (replace to prevent back navigation)
      router.replace('/login')
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="flex min-h-[44px] w-full items-center space-x-2 px-4 py-3 text-left text-sm text-danger hover:bg-gray-50 disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      <span>{loading ? 'Logging out...' : 'Logout'}</span>
    </button>
  )
}

function TopBar({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const { user } = useAuth()
  const { currency, ledgerMonthKey, shiftLedgerMonth } = useFinance()
  const { openQuickAdd } = useQuickAdd()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const [y, m] = (ledgerMonthKey || '').split('-').map(Number)
  const labelMonth = Number.isFinite(y) && Number.isFinite(m) ? m - 1 : new Date().getMonth()
  const labelYear = Number.isFinite(y) ? y : new Date().getFullYear()

  const handlePrevMonth = () => shiftLedgerMonth(-1)
  const handleNextMonth = () => shiftLedgerMonth(1)

  return (
    <header className="border-b border-white/45 bg-white/50 px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/38 sm:px-4 sm:py-4 lg:border-sea-900/10 lg:bg-white/52 lg:px-6 lg:supports-[backdrop-filter]:bg-white/44">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-2 sm:gap-4">
        {/* Left: Menu & Month Selector */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="flex-shrink-0 rounded-xl p-2 transition-colors hover:bg-white/50 lg:hidden"
          >
            <Menu className="h-5 w-5 text-text-secondary" />
          </button>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={handlePrevMonth}
              className="flex-shrink-0 rounded-xl p-1.5 transition-colors hover:bg-white/50 lg:hover:bg-white/45"
            >
              <ChevronLeft className="h-4 w-4 text-text-secondary sm:h-5 sm:w-5" />
            </button>
            <span className="min-w-[100px] max-w-[140px] truncate text-center text-xs font-semibold tracking-tight text-neutral-800 sm:min-w-[120px] sm:text-sm">
              {monthNames[labelMonth]} {labelYear}
            </span>
            <button
              onClick={handleNextMonth}
              className="flex-shrink-0 rounded-xl p-1.5 transition-colors hover:bg-white/50 lg:hover:bg-gray-100"
            >
              <ChevronRight className="h-4 w-4 text-text-secondary sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* Right: Currency & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {user && (
            <div
              className="inline-flex min-h-[40px] items-center gap-1 rounded-xl border border-sea-200/65 bg-sea-50/75 px-2 py-1.5 text-xs font-medium text-sea-900 backdrop-blur-sm"
              title="Finance & agenda sync to your account when online (Firestore)"
            >
              <Cloud className="w-4 h-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline whitespace-nowrap">Live sync</span>
            </div>
          )}
          {/* Currency Badge */}
          <div className="flex min-h-[40px] items-center rounded-xl border border-white/55 bg-white/40 px-2.5 py-1.5 backdrop-blur-md sm:px-3">
            <span className="text-xs font-semibold tabular-nums text-neutral-800 sm:text-sm" title={currency}>
              {getCurrencySymbol(currency)}
            </span>
          </div>

          <button
            type="button"
            onClick={openQuickAdd}
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-sea-600 p-2.5 text-white shadow-md shadow-sea-600/25 transition-colors hover:bg-sea-700 lg:flex"
            aria-label="Quick add income or expense"
            title="Quick add income or expense"
          >
            <Plus className="w-5 h-5" aria-hidden />
          </button>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2 rounded-xl p-1.5 transition-colors hover:bg-white/50 lg:hover:bg-white/40"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sea-500 to-sea-700 shadow-md shadow-sea-600/30">
                <span className="text-sm font-medium text-white">U</span>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-text-secondary sm:block" />
            </button>

            {profileOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setProfileOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-52 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/55 bg-white/82 py-2 shadow-dock backdrop-blur-2xl">
                  <LogoutButton />
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
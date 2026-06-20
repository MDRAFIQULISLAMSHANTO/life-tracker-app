'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import TopBar from '../../components/layout/TopBar'
import MobileTabBar from '../../components/layout/MobileTabBar'
import AiAdvisor from '../../components/chat/AiAdvisor'
import { DashboardTodayProvider } from '../../context/DashboardTodayContext'
import { QuickAddProvider } from '../../context/QuickAddContext'

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setSidebarOpen(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return (
    <DashboardTodayProvider>
      <QuickAddProvider>
        <div className="app-shell-h flex overflow-hidden bg-light-gradient dark:bg-dark-gradient" style={{ minHeight: 0 }}>
          <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <TopBar onMenuClick={() => setSidebarOpen((o) => !o)} />
            <main className="scroll-touch min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-[max(0.75rem,env(safe-area-inset-bottom))] touch-pan-y">
              <div className="container mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6" style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 5rem))' }}>
                {children}
              </div>
            </main>
          </div>
          <MobileTabBar />
          <AiAdvisor />
        </div>
      </QuickAddProvider>
    </DashboardTodayProvider>
  )
}

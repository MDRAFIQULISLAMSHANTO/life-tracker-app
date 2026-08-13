'use client'

import { useState, useEffect } from 'react'
import Sidebar from '../../components/layout/Sidebar'
import TopBar from '../../components/layout/TopBar'
import MobileTabBar from '../../components/layout/MobileTabBar'
import AiAdvisor from '../../components/chat/AiAdvisor'
import { ContentProvider } from '../../context/ContentContext'
import { DashboardTodayProvider } from '../../context/DashboardTodayContext'
import { PrivacyProvider } from '../../context/PrivacyContext'
import { GrowthProvider } from '../../context/GrowthContext'
import { QuickAddProvider } from '../../context/QuickAddContext'
import ReminderRunner from '../../components/ReminderRunner'
import FirstRunSheet from '../../components/dashboard/FirstRunSheet'

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
      <GrowthProvider>
        {/* Shared live content (daily quote + study library) — dashboard only,
            so the marketing pages don't open Firestore listeners. */}
        <ContentProvider>
        <PrivacyProvider>
        <QuickAddProvider>
          <div className="app-shell-h flex overflow-hidden bg-light-gradient dark:bg-dark-gradient" style={{ minHeight: 0 }}>
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <TopBar onMenuClick={() => setSidebarOpen((o) => !o)} />
              <main className="scroll-touch min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain touch-pan-y">
                <div
                  className="container mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6"
                  // Clears the mobile tab bar (64px) plus the home indicator
                  style={{ paddingBottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 6.5rem))' }}
                >
                  {children}
                </div>
              </main>
            </div>
            <MobileTabBar />
            <AiAdvisor />
            <ReminderRunner />
            <FirstRunSheet />
          </div>
        </QuickAddProvider>
        </PrivacyProvider>
        </ContentProvider>
      </GrowthProvider>
    </DashboardTodayProvider>
  )
}

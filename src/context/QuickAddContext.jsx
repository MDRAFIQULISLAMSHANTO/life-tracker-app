'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import QuickAddModal from '../components/modals/QuickAddModal'

const QuickAddContext = createContext(null)

export function QuickAddProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false)

  const openQuickAdd = useCallback(() => setIsOpen(true), [])
  const closeQuickAdd = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, openQuickAdd, closeQuickAdd }),
    [isOpen, openQuickAdd, closeQuickAdd]
  )

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <QuickAddModal isOpen={isOpen} onClose={closeQuickAdd} />
    </QuickAddContext.Provider>
  )
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext)
  if (!ctx) throw new Error('useQuickAdd must be used within QuickAddProvider')
  return ctx
}

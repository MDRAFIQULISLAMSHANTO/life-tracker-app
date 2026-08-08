'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Trackers were folded into Habits and Goals — GrowthContext migrates any
 * legacy tracker rows on first load, so this route only needs to forward.
 */
export default function TrackersRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/habits')
  }, [router])
  return null
}

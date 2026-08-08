'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Legacy tracker detail — migrated into Habits. */
export default function TrackerDetailRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/habits')
  }, [router])
  return null
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Income and Expenses were the same page twice — same form, same table,
 * differing only by `type`. They are now one ledger with a direction filter,
 * so this route only needs to forward. Kept so existing links and any
 * home-screen shortcuts don't 404.
 */
export default function LedgerRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/ledger')
  }, [router])
  return null
}

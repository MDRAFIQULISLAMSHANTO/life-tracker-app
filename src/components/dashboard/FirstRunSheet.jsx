'use client'

/**
 * First run.
 *
 * Two questions, both of which the app previously guessed wrong: currency was
 * hardcoded to BDT for everyone, and opening balances silently started at zero
 * so the wallet read "0" until you back-filled history.
 *
 * Deliberately not asking "what do you want to improve?" — the growth module
 * already seeds a starter set of habits and goals, and adding another on top of
 * those makes the first screen busier, not clearer.
 */

import { useEffect, useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useFinance } from '../../context/FinanceContext'
import { CURRENCY_OPTIONS } from '../../utils/currencyOptions'
import { Button, Field, Input, Select, Sheet } from '../ui'

/** Offered first; everything else stays available through the full list. */
const COMMON = ['BDT', 'USD', 'EUR', 'GBP', 'INR', 'PKR', 'AED', 'SAR', 'MYR', 'AUD', 'CAD']

export default function FirstRunSheet() {
  const { user, loading } = useAuth()
  const { onboarded, accounts, completeOnboarding } = useFinance()

  const [open, setOpen] = useState(false)
  const [currency, setCurrency] = useState('BDT')
  const [balances, setBalances] = useState({})

  // Only after auth and the cloud payload have settled, so an existing account
  // never sees a flash of the sheet while `onboarded` is still defaulting.
  useEffect(() => {
    if (loading || !user) return
    setOpen(!onboarded)
  }, [loading, user, onboarded])

  const options = useMemo(() => {
    const common = CURRENCY_OPTIONS.filter((c) => COMMON.includes(c.code))
    const rest = CURRENCY_OPTIONS.filter((c) => !COMMON.includes(c.code))
    return { common, rest }
  }, [])

  const submit = (e) => {
    e.preventDefault()
    completeOnboarding({ currency, openingBalances: balances })
    setOpen(false)
  }

  const skip = () => {
    // Still counts as answered — the default currency stands and we don't nag.
    completeOnboarding({ currency })
    setOpen(false)
  }

  if (!user) return null

  return (
    <Sheet open={open} onClose={skip} title="Welcome to Livio">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Two quick things and the numbers will be yours rather than mine.
        </p>

        <Field label="Which currency do you use?">
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <optgroup label="Common">
              {options.common.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="All currencies">
              {options.rest.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
            What do you have right now? (optional)
          </p>
          <div className="flex flex-col gap-2.5">
            {accounts.map((a) => (
              <Field key={a.id} label={a.name}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="0"
                  value={balances[a.id] ?? ''}
                  onChange={(e) => setBalances((b) => ({ ...b, [a.id]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-3)' }}>
            Your opening balance. You can change it any time in Settings.
          </p>
        </div>

        <Button type="submit" size="lg" full>
          <Wallet className="h-4 w-4" />
          Start tracking
        </Button>
        <Button type="button" variant="ghost" onClick={skip} full>
          Skip for now
        </Button>
      </form>
    </Sheet>
  )
}

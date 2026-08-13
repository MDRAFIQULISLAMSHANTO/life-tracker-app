'use client'

import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import Navbar from '../../components/landing/Navbar'
import Footer from '../../components/landing/Footer'

/**
 * Honest pricing.
 *
 * This page used to advertise a "Pro" tier promising team collaboration and
 * priority support against a single-user data model with no billing of any
 * kind. Livio is free, personal, and built in the open — say that instead of
 * writing cheques the product can't cash.
 */

const INCLUDED = [
  'Unlimited income, expenses and accounts',
  'Budgets, loans and monthly reports',
  'Tasks with deadlines and reminders',
  'Habits, goals and the daily plan',
  'Works offline; installs as an app',
  'Your data syncs privately across your devices',
]

const HONEST_LIMITS = [
  'Built for one person — no shared or team accounts',
  'Recurring transactions are not automated yet',
  'No bank import; entries are added by hand',
]

export default function PricingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-12 text-center sm:mb-16">
          <h1
            className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl"
            style={{ color: 'var(--text-1)' }}
          >
            Free, and honest about it
          </h1>
          <p
            className="mx-auto max-w-2xl text-base sm:text-lg"
            style={{ color: 'var(--text-2)' }}
          >
            Livio is a personal project, free to use. No plans, no card, no upsell waiting
            three screens in.
          </p>
        </div>

        <div
          className="surface-1 rounded-2xl border-2 p-8"
          style={{ borderColor: 'var(--accent)' }}
        >
          <div className="mb-6">
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold" style={{ color: 'var(--text-1)' }}>
                $0
              </span>
              <span style={{ color: 'var(--text-3)' }}>forever</span>
            </div>
            <p style={{ color: 'var(--text-2)' }}>Everything in the app, for everyone.</p>
          </div>

          <ul className="mb-8 space-y-3">
            {INCLUDED.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: 'var(--accent)' }}
                  aria-hidden
                />
                <span style={{ color: 'var(--text-2)' }}>{feature}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="accent-btn w-full rounded-lg py-3 font-medium"
          >
            Create your account
          </button>
        </div>

        <div className="mt-10">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-3)' }}>
            What it doesn&apos;t do yet
          </h2>
          <ul className="space-y-2">
            {HONEST_LIMITS.map((limit) => (
              <li key={limit} className="text-sm" style={{ color: 'var(--text-2)' }}>
                — {limit}
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  )
}

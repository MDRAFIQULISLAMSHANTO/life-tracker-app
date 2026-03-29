'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wallet, Activity, BarChart3, Cloud, ArrowRight } from 'lucide-react'

const items = [
  {
    icon: Wallet,
    title: 'Money & budgets',
    text: 'Income, expenses, loans, and monthly budgets in one ledger.',
  },
  {
    icon: BarChart3,
    title: 'Reports & export',
    text: 'Charts for the selected month plus Excel export and import.',
  },
  {
    icon: Activity,
    title: 'Trackers',
    text: 'Habits and goals with simple check-ins.',
  },
  {
    icon: Cloud,
    title: 'Sync',
    text: 'Signed-in data stays in sync across your devices.',
  },
]

export default function LandingValueSection() {
  const router = useRouter()

  return (
    <section className="border-t border-neutral-200/80 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        <div className="max-w-2xl mb-12 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
            Everything you need, without clutter
          </h2>
          <p className="mt-3 text-neutral-600 text-base sm:text-lg leading-relaxed">
            One app for personal finance and daily productivity—fast on mobile and desktop.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {items.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-neutral-200/90 bg-neutral-50/50 p-5 sm:p-6 flex gap-4"
            >
              <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon className="w-5 h-5" aria-hidden />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">{title}</h3>
                <p className="mt-1.5 text-sm text-neutral-600 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 sm:mt-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 rounded-2xl border border-neutral-200 bg-neutral-50/80 px-6 py-6 sm:px-8 sm:py-7">
          <p className="text-neutral-800 font-medium">Ready to try Livio?</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 sm:px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-600 shadow-sm"
            >
              Create account
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
            <Link
              href="/login"
              className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Sign in
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-neutral-500">
          <Link href="/features" className="text-primary font-medium hover:underline">
            Feature details
          </Link>
          <span className="mx-2 text-neutral-300">·</span>
          <Link href="/pricing" className="text-primary font-medium hover:underline">
            Pricing
          </Link>
          <span className="mx-2 text-neutral-300">·</span>
          <Link href="/contact" className="text-primary font-medium hover:underline">
            Contact
          </Link>
        </p>
      </div>
    </section>
  )
}

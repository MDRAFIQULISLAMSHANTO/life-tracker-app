'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '../common/Logo'

export default function Hero() {
  const router = useRouter()

  return (
    <section className="relative bg-neutral-100/90 border-b border-neutral-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl bg-white border border-neutral-200/90 shadow-sm flex items-center justify-center">
              <Logo variant="icon" size="lg" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-neutral-900 tracking-tight leading-[1.1]">
            Life and money,
            <span className="block text-neutral-500 font-medium mt-1">organized clearly</span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-neutral-600 max-w-xl mx-auto leading-relaxed">
            Budgets, transactions, trackers, and reports—minimal interface, quick to use anywhere.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="min-h-[48px] px-6 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-600 shadow-sm"
            >
              Create account
            </button>
            <Link
              href="/login"
              className="min-h-[48px] inline-flex items-center justify-center px-6 rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

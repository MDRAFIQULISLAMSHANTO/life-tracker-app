'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, TrendingUp, TrendingDown, Wallet, Shield, Zap, BarChart3 } from 'lucide-react'

const STATS = [
  { label: 'Monthly Income', value: '+$4,820', icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  { label: 'Expenses', value: '$2,340', icon: TrendingDown, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  { label: 'Net Saved', value: '$2,480', icon: Wallet, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
]

const FEATURES = [
  { icon: BarChart3, title: 'Smart budgets', desc: 'Track every category with visual progress' },
  { icon: Zap, title: 'Instant add', desc: 'Log transactions in under 3 seconds' },
  { icon: Shield, title: 'Privacy first', desc: 'Your data, your device, Firestore sync' },
]

export default function Hero() {
  const router = useRouter()

  return (
    <div style={{ background: '#f4f5f7', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Hero section */}
      <section className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: text */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Zap className="w-3 h-3" />
              Personal finance, redesigned
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5"
              style={{ color: '#0f0f1a' }}>
              Money management{' '}
              <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                that actually sticks
              </span>
            </h1>

            <p className="text-lg sm:text-xl leading-relaxed mb-8" style={{ color: '#64748b' }}>
              Budgets, transactions, trackers, and reports — minimal interface, fast to use anywhere. Your finances, finally under control.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <button type="button" onClick={() => router.push('/signup')}
                className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-base font-bold text-white transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.35)' }}>
                Start for free <ArrowRight className="w-4 h-4" />
              </button>
              <Link href="/login"
                className="flex items-center justify-center px-6 py-3.5 rounded-2xl text-base font-bold transition-all hover:bg-black/5"
                style={{ border: '1.5px solid rgba(0,0,0,0.12)', color: '#0f0f1a' }}>
                Sign in
              </Link>
            </div>

            {/* Features mini grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title}
                  className="p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                  style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)' }}>
                  <Icon className="w-5 h-5 mb-2" style={{ color: '#6366f1' }} />
                  <p className="text-sm font-bold mb-0.5" style={{ color: '#0f0f1a' }}>{title}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating dashboard mockup */}
          <div className="relative flex justify-center lg:justify-end">
            {/* Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div style={{ width: 400, height: 400, background: 'radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%)', borderRadius: '50%' }} />
            </div>

            <div className="relative w-full max-w-sm">
              {/* Main card */}
              <div
                className="rounded-3xl p-6 mb-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  boxShadow: '0 24px 80px rgba(99,102,241,0.35), 0 8px 24px rgba(0,0,0,0.1)',
                  transform: 'rotate(-2deg)',
                }}
              >
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)', transform: 'translate(30%,-30%)' }} />
                <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Total Balance</p>
                <p className="text-white text-4xl font-black tabular-nums mb-1">$12,480</p>
                <p className="text-white/60 text-xs">Updated just now</p>
                <div className="flex gap-2 mt-5">
                  <div className="flex-1 py-2.5 rounded-xl text-center text-white/90 text-sm font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>Deposit</div>
                  <div className="flex-1 py-2.5 rounded-xl text-center text-white text-sm font-bold" style={{ background: 'rgba(0,0,0,0.25)' }}>Send</div>
                </div>
              </div>

              {/* Stats cards */}
              <div className="space-y-3" style={{ transform: 'rotate(1deg)' }}>
                {STATS.map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold" style={{ color: '#64748b' }}>{label}</p>
                    </div>
                    <p className="text-sm font-extrabold tabular-nums" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

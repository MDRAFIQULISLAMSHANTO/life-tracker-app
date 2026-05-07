'use client'

import { useRouter } from 'next/navigation'
import {
  Wallet, Activity, BarChart3, Cloud, ArrowRight,
  ShieldCheck, Smartphone, Layers, Lock,
} from 'lucide-react'

const FEATURES = [
  {
    icon: Wallet,
    title: 'Full ledger',
    text: 'Log income, expenses, and loans. Set monthly budgets per category and know exactly where every taka goes.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
  {
    icon: BarChart3,
    title: 'Visual reports',
    text: 'Spending donut, daily trend line, and budget-vs-actual bar chart. Understand your money at a glance.',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    icon: Activity,
    title: 'Reminders & notes',
    text: 'Add events, to-do reminders, and quick notes. Get push notifications for pending tasks when installed.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
  },
  {
    icon: Cloud,
    title: 'Real-time sync',
    text: 'Firebase-powered sync keeps all your devices in perfect agreement — instantly, automatically.',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
  },
  {
    icon: Smartphone,
    title: 'Works as an app',
    text: 'Install to your home screen on Android or iPhone. Feels and behaves like a native app.',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
  },
  {
    icon: Layers,
    title: 'Multi-account',
    text: 'Add bKash, City Bank, cash, or any custom account name. Transfer between them with a tap.',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy first',
    text: 'Your data lives in your own Firebase project. No third-party analytics, no ads, ever.',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)',
  },
  {
    icon: Lock,
    title: 'Secure sign-in',
    text: 'Google OAuth, email/password, or phone OTP — pick the method that suits you.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
  },
]

export default function LandingValueSection() {
  const router = useRouter()

  return (
    <section className="py-16 sm:py-20 lg:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
            style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            Everything in one place
          </div>
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-4"
            style={{ color: '#0f0f1a' }}
          >
            Built for how you{' '}
            <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              actually live
            </span>
          </h2>
          <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#64748b' }}>
            No bloat, no subscriptions required. Fast, beautiful, and works on every device.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, text, color, bg }) => (
            <div
              key={title}
              className="p-5 rounded-2xl transition-all hover:-translate-y-1"
              style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.9)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: bg }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="text-sm font-bold mb-1.5" style={{ color: '#0f0f1a' }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>{text}</p>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div
          className="mt-14 sm:mt-16 rounded-3xl p-6 sm:p-8 lg:p-10 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#a78bfa 100%)',
            boxShadow: '0 24px 80px rgba(99,102,241,0.3)',
          }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 pointer-events-none"
            style={{ background: 'rgba(255,255,255,0.4)', transform: 'translate(30%,-30%)' }}
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
                Ready to take control?
              </h3>
              <p className="text-white/70 text-sm sm:text-base">
                Free to start. No credit card needed.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.95)', color: '#6366f1' }}
              >
                Create account <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="flex items-center justify-center px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:bg-white/10"
                style={{ border: '1.5px solid rgba(255,255,255,0.4)' }}
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

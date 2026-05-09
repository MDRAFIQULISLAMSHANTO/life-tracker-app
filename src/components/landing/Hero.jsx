'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, TrendingUp, TrendingDown, Wallet, Shield, Zap, BarChart3, Smartphone } from 'lucide-react'

const STATS = [
  { label: 'Monthly Income', value: '+৳55,000', Icon: TrendingUp, color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  { label: 'Expenses', value: '৳28,340', Icon: TrendingDown, color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  { label: 'Net Saved', value: '৳26,660', Icon: Wallet, color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
]

const PILLS = [
  { Icon: BarChart3, label: 'Smart budgets' },
  { Icon: Zap, label: 'Instant add' },
  { Icon: Shield, label: 'Firestore sync' },
  { Icon: Smartphone, label: 'PWA ready' },
]

export default function Hero() {
  const router = useRouter()

  return (
    <section style={{ padding: 'clamp(56px,8vw,112px) 0 clamp(40px,6vw,80px)' }}>
      <div style={{ maxWidth: 1152, margin: '0 auto', padding: '0 20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))',
            gap: 'clamp(40px,6vw,72px)',
            alignItems: 'center',
          }}
        >
          {/* Left */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 13px', borderRadius: 999, marginBottom: 24,
              background: 'rgba(99,102,241,0.09)',
              border: '1px solid rgba(99,102,241,0.18)',
              color: '#6366f1', fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
            }}>
              <Zap style={{ width: 12, height: 12 }} />
              Personal finance, redesigned
            </div>

            <h1 style={{
              fontSize: 'clamp(2.2rem,5.5vw,3.6rem)',
              fontWeight: 900,
              lineHeight: 1.09,
              letterSpacing: '-0.03em',
              color: '#0f0f1a',
              marginBottom: 20,
            }}>
              Money management{' '}
              <span style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                that actually sticks
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(1rem,2vw,1.125rem)',
              lineHeight: 1.72,
              color: '#64748b',
              marginBottom: 32,
              maxWidth: 480,
            }}>
              Budgets, transactions, loans, and reports — minimal interface, fast anywhere.
              Your finances, finally under control.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 36 }}>
              <button
                type="button"
                onClick={() => router.push('/signup')}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.32)',
                  fontFamily: 'inherit',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(99,102,241,0.42)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.32)' }}
              >
                Start for free <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
              <Link
                href="/login"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '12px 22px', borderRadius: 14, textDecoration: 'none',
                  border: '1.5px solid rgba(0,0,0,0.12)',
                  color: '#0f0f1a', fontSize: 15, fontWeight: 600,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Sign in
              </Link>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PILLS.map(({ Icon, label }) => (
                <div key={label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 13px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(0,0,0,0.07)',
                  color: '#64748b', fontSize: 12, fontWeight: 600,
                }}>
                  <Icon style={{ width: 13, height: 13, color: '#6366f1' }} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating card mockup */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            {/* Glow */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 55% 45%,rgba(99,102,241,0.18) 0%,transparent 65%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', width: '100%', maxWidth: 340 }}>
              {/* Balance card */}
              <div style={{
                borderRadius: 28,
                padding: '28px 24px 22px',
                background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#a78bfa 100%)',
                boxShadow: '0 24px 72px rgba(99,102,241,0.32), 0 8px 24px rgba(0,0,0,0.08)',
                transform: 'rotate(-2deg)',
                marginBottom: 16,
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  width: 180, height: 180, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  transform: 'translate(35%,-35%)',
                  pointerEvents: 'none',
                }} />
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Total Balance
                </p>
                <p style={{ color: '#fff', fontSize: 38, fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 2 }}>
                  ৳45,540
                </p>
                <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 11, marginBottom: 18 }}>
                  3 accounts · May 2026
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '9px 0', borderRadius: 12, textAlign: 'center', color: 'rgba(255,255,255,0.90)', fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.18)' }}>
                    Income
                  </div>
                  <div style={{ flex: 1, padding: '9px 0', borderRadius: 12, textAlign: 'center', color: '#fff', fontSize: 13, fontWeight: 700, background: 'rgba(0,0,0,0.22)' }}>
                    Expense
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, transform: 'rotate(0.8deg)' }}>
                {STATS.map(({ label, value, Icon, color, bg }) => (
                  <div key={label} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 18,
                    background: 'rgba(255,255,255,0.88)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.95)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon style={{ width: 16, height: 16, color }} />
                    </div>
                    <p style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#64748b' }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color, letterSpacing: '-0.01em' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

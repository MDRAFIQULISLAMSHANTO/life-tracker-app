'use client'

import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, SlidersHorizontal, TrendingDown, TrendingUp, ArrowLeftRight } from 'lucide-react'
import Link from 'next/link'

const CARD_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#f97316', // orange
  '#a855f7', // purple
  '#14b8a6', // teal
  '#ec4899', // pink
  '#eab308', // amber
  '#ef4444', // red
]

const WALLET_THEMES = [
  { id: 'indigo',   css: 'linear-gradient(150deg,#1a1740 0%,#2e2b72 55%,#1a1740 100%)', accent: 'rgba(99,102,241,0.15)' },
  { id: 'burgundy', css: 'linear-gradient(150deg,#3b0612 0%,#7f1d1d 55%,#3b0612 100%)', accent: 'rgba(239,68,68,0.12)'   },
  { id: 'coastal',  css: 'linear-gradient(150deg,#062236 0%,#0369a1 55%,#062236 100%)', accent: 'rgba(56,189,248,0.12)'  },
  { id: 'noir',     css: 'linear-gradient(150deg,#0a0a0a 0%,#1c1c1c 55%,#0a0a0a 100%)', accent: 'rgba(255,255,255,0.06)' },
  { id: 'forest',   css: 'linear-gradient(150deg,#042311 0%,#166534 55%,#042311 100%)', accent: 'rgba(34,197,94,0.12)'   },
  { id: 'rose',     css: 'linear-gradient(150deg,#3b0a1c 0%,#881337 55%,#3b0a1c 100%)', accent: 'rgba(244,63,94,0.12)'   },
]

const CARD_H = 52

export default function WalletCard({ accountBalances, totalBalance, currency, formatCurrency }) {
  const [visible, setVisible] = useState(false)
  const [themeIdx, setThemeIdx] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const cardRefs = useRef([])
  const bodyRef = useRef(null)
  const pickerRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('livio_wallet_theme')
    if (saved !== null) setThemeIdx(Number(saved))
  }, [])

  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      const cards = cardRefs.current.filter(Boolean)
      if (cards.length) {
        gsap.fromTo(cards,
          { y: -40, opacity: 0, scale: 0.88 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: { each: 0.09, from: 'end' }, ease: 'back.out(1.5)', delay: 0.05 }
        )
      }
      if (bodyRef.current) {
        gsap.fromTo(bodyRef.current, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out', delay: 0.18 })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (showPicker && pickerRef.current) {
      import('gsap').then(({ gsap }) => {
        gsap.fromTo(pickerRef.current, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' })
      }).catch(() => {})
    }
  }, [showPicker])

  const theme = WALLET_THEMES[themeIdx % WALLET_THEMES.length]
  const displayAccs = (accountBalances || []).slice(0, 3)
  const n = displayAccs.length

  return (
    <div className="wallet-outer select-none" style={{ userSelect: 'none' }}>

      {/* ── Stacked account cards ── */}
      {n > 0 && (
        <div style={{ position: 'relative', height: `${(n - 1) * 16 + CARD_H}px`, zIndex: 10 }}>
          {displayAccs.map((acc, i) => (
            <div
              key={acc.id}
              ref={el => { cardRefs.current[i] = el }}
              className="absolute flex items-center justify-between px-4 rounded-2xl"
              style={{
                left: `${i * 4}px`,
                right: `${i * 4}px`,
                height: CARD_H,
                top: `${i * 16}px`,
                zIndex: n - i,
                background: CARD_COLORS[i % CARD_COLORS.length],
                transform: `scale(${1 - i * 0.022})`,
                transformOrigin: 'top center',
                boxShadow: `0 ${6 + i * 2}px ${20 + i * 4}px rgba(0,0,0,0.28)`,
              }}
            >
              <span className="text-white/90 font-semibold text-sm truncate max-w-[55%]">{acc.name}</span>
              <span className="text-white font-bold text-sm tabular-nums">
                {visible ? formatCurrency(acc.balance, currency) : '•••'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Wallet body ── */}
      <div
        ref={bodyRef}
        className="relative rounded-3xl overflow-hidden"
        style={{
          marginTop: n > 0 ? -20 : 0,
          background: theme.css,
          boxShadow: '0 20px 60px rgba(0,0,0,0.42), 0 4px 14px rgba(0,0,0,0.22)',
        }}
      >
        {/* Noise grain overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E\")",
            backgroundSize: '180px',
            opacity: 0.55,
            mixBlendMode: 'overlay',
          }}
        />
        {/* Stitching border */}
        <div
          className="absolute pointer-events-none rounded-[1.4rem]"
          style={{ inset: 10, border: '1.5px dashed rgba(255,255,255,0.11)' }}
        />
        {/* Top sheen */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, transparent 55%)' }}
        />

        <div className="relative z-10 px-5 pb-5 pt-4">
          {/* Icons row */}
          <div className="flex justify-between items-center mb-4">
            <button
              type="button"
              onClick={() => setShowPicker(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.13)' }}
              aria-label="Change wallet theme"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-white/70" />
            </button>
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.13)' }}
              aria-label={visible ? 'Hide balance' : 'Show balance'}
            >
              {visible
                ? <EyeOff className="w-3.5 h-3.5 text-white/70" />
                : <Eye className="w-3.5 h-3.5 text-white/70" />}
            </button>
          </div>

          {/* Balance */}
          <div className="text-center mb-1">
            <p suppressHydrationWarning className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums tracking-tight leading-none">
              {visible ? formatCurrency(totalBalance, currency) : '$ •••••'}
            </p>
          </div>
          <p className="text-center text-[11px] text-white/40 mb-5">tap eye to reveal</p>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/dashboard/income"
              className="flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold text-white transition-all active:scale-95 hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <TrendingDown className="w-3.5 h-3.5 shrink-0" />
              <span>Income</span>
            </Link>
            <Link
              href="/dashboard/accounts"
              className="flex items-center justify-center rounded-full py-2.5 transition-all active:scale-95 hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.09)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
              aria-label="Accounts / Transfer"
            >
              <ArrowLeftRight className="w-4 h-4 text-white/60" />
            </Link>
            <Link
              href="/dashboard/expenses"
              className="flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold text-white transition-all active:scale-95 hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.13)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
            >
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Expense</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Theme picker ── */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="mt-3 rounded-2xl p-3"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5" style={{ color: 'var(--text-3)' }}>Wallet skin</p>
          <div className="flex gap-2 flex-wrap">
            {WALLET_THEMES.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setThemeIdx(i)
                  localStorage.setItem('livio_wallet_theme', String(i))
                  setShowPicker(false)
                }}
                className="w-11 h-8 rounded-xl transition-all active:scale-90"
                style={{
                  background: t.css,
                  outline: i === themeIdx ? '2px solid var(--accent)' : 'none',
                  outlineOffset: 2,
                  boxShadow: i === themeIdx ? '0 0 0 4px rgba(var(--accent-rgb),0.2)' : 'none',
                }}
                aria-label={t.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

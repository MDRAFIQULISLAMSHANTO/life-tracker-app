'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePrivacy } from '../../context/PrivacyContext'

const CARD_GRADIENTS = [
  'linear-gradient(105deg,#2fa83d,#44c055,#38b548)',
  'linear-gradient(105deg,#3040cc,#4556e8,#3848d8)',
  'linear-gradient(105deg,#d84010,#f05a28,#e84c1c)',
  'linear-gradient(105deg,#6d28d9,#8b5cf6,#7c3aed)',
  'linear-gradient(105deg,#0891b2,#06b6d4,#0ea5e9)',
  'linear-gradient(105deg,#be185d,#ec4899,#db2777)',
]

export const LEATHER_THEMES = [
  {
    id: 'saddle',    name: 'Saddle Tan',
    svgFill: '#b5722a',
    leatherBg: 'linear-gradient(155deg,#c4802e 0%,#a86222 40%,#b87830 70%,#9e5a1e 100%)',
    glassTint: 'rgba(120,60,10,0.22)',
    swatch: 'linear-gradient(135deg,#c4802e,#9e5a1e)',
    shadow: '0 22px 55px rgba(100,50,0,0.45)',
    textColor: '#fff', subColor: 'rgba(255,235,200,0.80)',
    btnBg: 'rgba(255,255,255,0.12)', btnBorder: 'rgba(255,255,255,0.24)',
    badgeBg: 'rgba(255,255,255,0.18)', dotBg: '#c8802a',
  },
  {
    id: 'cognac',    name: 'Cognac',
    svgFill: '#9a4e1a',
    leatherBg: 'linear-gradient(155deg,#aa5820 0%,#8c3e12 40%,#a04e1c 70%,#7e3410 100%)',
    glassTint: 'rgba(80,25,5,0.24)',
    swatch: 'linear-gradient(135deg,#aa5820,#7e3410)',
    shadow: '0 22px 55px rgba(80,30,0,0.52)',
    textColor: '#fff', subColor: 'rgba(255,220,180,0.80)',
    btnBg: 'rgba(255,255,255,0.12)', btnBorder: 'rgba(255,255,255,0.22)',
    badgeBg: 'rgba(255,255,255,0.18)', dotBg: '#a05020',
  },
  {
    id: 'chestnut',  name: 'Chestnut',
    svgFill: '#7a3518',
    leatherBg: 'linear-gradient(155deg,#8a3e1c 0%,#6e2810 40%,#843818 70%,#622010 100%)',
    glassTint: 'rgba(60,15,5,0.26)',
    swatch: 'linear-gradient(135deg,#8a3e1c,#622010)',
    shadow: '0 22px 55px rgba(60,20,0,0.55)',
    textColor: '#fff', subColor: 'rgba(255,210,170,0.78)',
    btnBg: 'rgba(255,255,255,0.11)', btnBorder: 'rgba(255,255,255,0.20)',
    badgeBg: 'rgba(255,255,255,0.18)', dotBg: '#8a4020',
  },
  {
    id: 'oxblood',   name: 'Oxblood',
    svgFill: '#6b1a1a',
    leatherBg: 'linear-gradient(155deg,#7a1e1e 0%,#5c1212 40%,#721c1c 70%,#501010 100%)',
    glassTint: 'rgba(50,5,5,0.30)',
    swatch: 'linear-gradient(135deg,#7a1e1e,#501010)',
    shadow: '0 22px 55px rgba(60,0,0,0.62)',
    textColor: '#fff', subColor: 'rgba(255,200,180,0.78)',
    btnBg: 'rgba(255,255,255,0.10)', btnBorder: 'rgba(255,255,255,0.18)',
    badgeBg: 'rgba(255,255,255,0.17)', dotBg: '#8a2020',
  },
  {
    id: 'chocolate', name: 'Chocolate',
    svgFill: '#3d2010',
    leatherBg: 'linear-gradient(155deg,#4a2614 0%,#361a0c 40%,#442210 70%,#2e1608 100%)',
    glassTint: 'rgba(20,8,2,0.34)',
    swatch: 'linear-gradient(135deg,#4a2614,#2e1608)',
    shadow: '0 22px 55px rgba(20,8,0,0.65)',
    textColor: '#fff', subColor: 'rgba(255,220,190,0.75)',
    btnBg: 'rgba(255,255,255,0.10)', btnBorder: 'rgba(255,255,255,0.18)',
    badgeBg: 'rgba(255,255,255,0.16)', dotBg: '#6a3818',
  },
  {
    id: 'caramel',   name: 'Caramel',
    svgFill: '#d4a050',
    leatherBg: 'linear-gradient(155deg,#e0b060 0%,#c89040 40%,#daa855 70%,#bc8835 100%)',
    glassTint: 'rgba(140,80,10,0.18)',
    swatch: 'linear-gradient(135deg,#e0b060,#bc8835)',
    shadow: '0 22px 55px rgba(150,90,0,0.35)',
    textColor: '#3a1e00', subColor: 'rgba(80,40,0,0.68)',
    btnBg: 'rgba(60,30,0,0.10)', btnBorder: 'rgba(60,30,0,0.20)',
    badgeBg: 'rgba(60,30,0,0.12)', dotBg: '#a07020',
  },
  {
    id: 'sand',      name: 'Sand Nude',
    svgFill: '#c8a880',
    leatherBg: 'linear-gradient(155deg,#d4b890 0%,#c0a070 40%,#ceb088 70%,#b89868 100%)',
    glassTint: 'rgba(100,65,20,0.15)',
    swatch: 'linear-gradient(135deg,#d4b890,#b89868)',
    shadow: '0 22px 55px rgba(120,80,30,0.30)',
    textColor: '#3a2800', subColor: 'rgba(70,45,10,0.68)',
    btnBg: 'rgba(50,30,0,0.09)', btnBorder: 'rgba(50,30,0,0.18)',
    badgeBg: 'rgba(50,30,0,0.10)', dotBg: '#9a7040',
  },
  {
    id: 'forest',    name: 'Forest',
    svgFill: '#3a5030',
    leatherBg: 'linear-gradient(155deg,#445e38 0%,#304828 40%,#3e5632 70%,#283e20 100%)',
    glassTint: 'rgba(15,35,10,0.28)',
    swatch: 'linear-gradient(135deg,#445e38,#283e20)',
    shadow: '0 22px 55px rgba(20,40,10,0.55)',
    textColor: '#fff', subColor: 'rgba(200,235,190,0.78)',
    btnBg: 'rgba(255,255,255,0.10)', btnBorder: 'rgba(255,255,255,0.18)',
    badgeBg: 'rgba(255,255,255,0.16)', dotBg: '#507040',
  },
  {
    id: 'black',     name: 'Black Shade',
    svgFill: '#181818',
    leatherBg: 'linear-gradient(155deg,#2a2a2a 0%,#181818 40%,#222222 70%,#101010 100%)',
    glassTint: 'rgba(0,0,0,0.40)',
    swatch: 'linear-gradient(135deg,#2a2a2a,#101010)',
    shadow: '0 22px 55px rgba(0,0,0,0.75)',
    textColor: '#fff', subColor: 'rgba(255,255,255,0.48)',
    btnBg: 'rgba(255,255,255,0.09)', btnBorder: 'rgba(255,255,255,0.16)',
    badgeBg: 'rgba(255,255,255,0.12)', dotBg: '#404040',
  },
  {
    id: 'charcoal',  name: 'Charcoal',
    svgFill: '#2e2e3c',
    leatherBg: 'linear-gradient(155deg,#3c3c50 0%,#282838 40%,#343448 70%,#1e1e2c 100%)',
    glassTint: 'rgba(8,8,20,0.34)',
    swatch: 'linear-gradient(135deg,#3c3c50,#1e1e2c)',
    shadow: '0 22px 55px rgba(8,8,28,0.68)',
    textColor: '#fff', subColor: 'rgba(210,210,255,0.52)',
    btnBg: 'rgba(255,255,255,0.09)', btnBorder: 'rgba(255,255,255,0.15)',
    badgeBg: 'rgba(255,255,255,0.12)', dotBg: '#585870',
  },
]

const STORAGE_KEY = 'livio_wallet_theme'
const CARD_H = 46
// Stack total height: first card + (n-1) cards with -2px overlap
function stackHeight(n) { return n > 0 ? CARD_H + Math.max(0, n - 1) * (CARD_H - 2) : 0 }

export default function WalletCard({ accountBalances, totalBalance, currency, formatCurrency, monthNet = 0, monthIncome = 0 }) {
  const [themeIdx,  setThemeIdx]  = useState(3)
  // Shared with the rest of the dashboard: one eye hides every figure.
  const { revealed, setRevealed } = usePrivacy()

  const cardEls     = useRef([])   // refs to each card DOM node
  const stackRef    = useRef(null) // ref to card stack container (controls height)
  const revealedRef = useRef(false) // tracks revealed without stale closure
  const animatingRef = useRef(false) // true while a reveal/hide tween is running

  // Keep ref in sync
  useEffect(() => { revealedRef.current = revealed }, [revealed])

  // Theme storage sync
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved !== null) setThemeIdx(Number(saved))
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue !== null) setThemeIdx(Number(e.newValue))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const theme      = LEATHER_THEMES[themeIdx % LEATHER_THEMES.length]
  const displayAccs = accountBalances || []
  const n          = displayAccs.length
  const tc         = theme.textColor
  // How far down to push cards so they hide fully behind leather body
  const hideY      = stackHeight(n) + 52

  const savingsRate = monthIncome > 0 ? (monthNet / monthIncome) * 100 : 0
  const isPositive  = monthNet >= 0

  // Snap the stack to match `revealed` on mount, when the account count
  // changes, and when the saved preference loads (which arrives a tick after
  // mount — without this the cards would stay shut while the eye said "open").
  // Skipped mid-toggle so it can't stomp on the animation below.
  useEffect(() => {
    if (animatingRef.current) return
    import('gsap').then(({ gsap }) => {
      const cards = cardEls.current.filter(Boolean)
      if (revealed) {
        if (stackRef.current) gsap.set(stackRef.current, { height: stackHeight(n) })
        if (cards.length) gsap.set(cards, { y: 0, opacity: 1 })
      } else {
        if (stackRef.current) gsap.set(stackRef.current, { height: 0 })
        if (cards.length) gsap.set(cards, { y: hideY, opacity: 0 })
      }
    }).catch(() => {})
  }, [n, hideY, revealed])

  const handleToggle = () => {
    const cards = cardEls.current.filter(Boolean)
    if (!cards.length) return

    animatingRef.current = true
    setTimeout(() => { animatingRef.current = false }, 700)

    import('gsap').then(({ gsap }) => {
      if (!revealedRef.current) {
        setRevealed(true)
        const sh = stackHeight(n)
        // Expand container and slide cards out simultaneously
        if (stackRef.current) gsap.to(stackRef.current, { height: sh, duration: 0.48, ease: 'power3.out' })
        gsap.to(cards, {
          y: 0, opacity: 1,
          duration: 0.55,
          stagger: { each: 0.07, from: 'start' },
          ease: 'back.out(1.6)',
        })
      } else {
        setRevealed(false)
        // Cards slide back in, then container collapses
        gsap.to(cards, {
          y: hideY, opacity: 0,
          duration: 0.38,
          stagger: { each: 0.05, from: 'end' },
          ease: 'power3.in',
        })
        if (stackRef.current) gsap.to(stackRef.current, { height: 0, duration: 0.32, delay: 0.18, ease: 'power2.in' })
      }
    }).catch(() => {})
  }

  return (
    <div
      style={{
        position: 'relative', userSelect: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        paddingTop: 10,
      }}
    >
      {/* Drop shadow */}
      <div style={{
        position: 'absolute', top: 60, left: 10, right: 10, bottom: 0,
        borderRadius: 26, boxShadow: theme.shadow, zIndex: 0, pointerEvents: 'none',
      }} />

      {/* ── Card Stack ── */}
      {n > 0 && (
        <div ref={stackRef} style={{ position: 'relative', zIndex: 2, padding: '0 14px', overflow: 'visible' }}>
          {displayAccs.map((acc, i) => (
            <div
              key={acc.id}
              ref={el => { cardEls.current[i] = el }}
              style={{
                marginTop: i === 0 ? 0 : -2,
                position: 'relative',
                zIndex: i + 1,
                width: '100%',
                height: CARD_H,
                borderRadius: '14px 14px 0 0',
                background: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 16px',
                color: '#fff', fontSize: 14, fontWeight: 600,
                boxShadow: '0 4px 18px rgba(0,0,0,0.28)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 12, right: 12, height: 1,
                background: 'rgba(255,255,255,0.42)', borderRadius: '50%', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
                background: 'linear-gradient(170deg,rgba(255,255,255,0.14) 0%,transparent 55%)',
              }} />
              <span style={{
                flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', paddingRight: 10, letterSpacing: '-0.01em',
                textShadow: '0 1px 3px rgba(0,0,0,0.28)',
              }}>
                {acc.name}
              </span>
              <span style={{ flexShrink: 0, fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.28)' }}>
                {revealed ? formatCurrency(acc.balance, currency) : '•••'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Leather Body ── */}
      <div style={{
        position: 'relative', zIndex: 5,
        marginTop: n > 0 ? -28 : 0,
        borderRadius: '0 0 26px 26px',
        overflow: 'hidden',
      }}>
        {/* SVG pocket seam with pull-tab hint */}
        <svg
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%', height: 40, marginBottom: -1 }}
        >
          <path d="M0,40 L0,26 Q200,-6 400,26 L400,40 Z" fill={theme.svgFill} />
          <path d="M10,26.5 Q200,-5 390,26.5"
            fill="none" stroke="rgba(255,255,255,0.30)"
            strokeWidth={1.4} strokeDasharray="4,4" strokeLinecap="round" />
          <path d="M10,28.5 Q200,-3 390,28.5"
            fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={1} />

        </svg>

        {/* Leather texture fill */}
        <div style={{ position: 'relative', zIndex: 5, padding: '4px 16px 20px', background: theme.leatherBg }}>
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            backgroundImage: [
              'repeating-linear-gradient(0deg,   transparent 0,transparent 5px,rgba(0,0,0,0.052) 5px,rgba(0,0,0,0.052) 6px)',
              'repeating-linear-gradient(90deg,  transparent 0,transparent 5px,rgba(0,0,0,0.052) 5px,rgba(0,0,0,0.052) 6px)',
            ].join(','),
          }} />
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            background: [
              'radial-gradient(ellipse 100% 50% at 50% 110%,rgba(0,0,0,0.32) 0%,transparent 70%)',
              'radial-gradient(ellipse 30% 100% at 0%   50%,rgba(0,0,0,0.20) 0%,transparent 60%)',
              'radial-gradient(ellipse 30% 100% at 100% 50%,rgba(0,0,0,0.20) 0%,transparent 60%)',
            ].join(','),
          }} />

          {/* ── Glass panel — stop propagation so taps here don't toggle cards ── */}
          <div
            style={{
              position: 'relative', zIndex: 1,
              background: theme.glassTint,
              backdropFilter: 'blur(22px) brightness(1.07) saturate(1.4)',
              WebkitBackdropFilter: 'blur(22px) brightness(1.07) saturate(1.4)',
              borderRadius: 18, padding: '10px 14px 14px',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{
              position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
              background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.25),transparent)',
              pointerEvents: 'none',
            }} />

            {/* Controls row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <Link href="/dashboard/settings" style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)',
                color: tc, textDecoration: 'none', flexShrink: 0,
              }} aria-label="Wallet settings">
                <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h2m8 0h2M6 4a1 1 0 102 0 1 1 0 00-2 0zM2 8h5m5 0h2M9 8a1 1 0 102 0 1 1 0 00-2 0zM2 12h2m8 0h2M6 12a1 1 0 102 0 1 1 0 00-2 0z"
                    stroke={tc} strokeWidth={1.5} strokeLinecap="round" />
                </svg>
              </Link>
              {/* Eye button — reveals/hides account cards + balance */}
              {n > 0 && (
                <button
                  onClick={handleToggle}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: revealed ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.10)',
                    border: `1px solid ${revealed ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.22)'}`,
                    color: tc, cursor: 'pointer', flexShrink: 0,
                    transition: 'background 0.2s, border 0.2s',
                  }}
                  aria-label={revealed ? 'Hide cards' : 'Show cards'}
                >
                  {revealed ? (
                    <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <path d="M7 3C4 3 1.5 7 1.5 7s2.5 4 5.5 4 5.5-4 5.5-4-2.5-4-5.5-4z" stroke={tc} strokeWidth={1.4} />
                      <circle cx="7" cy="7" r="1.6" fill={tc} />
                      <path d="M2 2L12 12" stroke={tc} strokeWidth={1.4} strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                      <path d="M7 3C4 3 1.5 7 1.5 7s2.5 4 5.5 4 5.5-4 5.5-4-2.5-4-5.5-4z" stroke={tc} strokeWidth={1.4} />
                      <circle cx="7" cy="7" r="1.6" fill={tc} />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* Balance */}
            <div suppressHydrationWarning style={{
              fontSize: 36, fontWeight: 700, color: tc,
              textAlign: 'center', letterSpacing: '-0.03em',
              margin: '4px 0 8px', lineHeight: 1.1,
              textShadow: tc === '#fff' ? '0 2px 14px rgba(0,0,0,0.35)' : 'none',
            }}>
              {revealed ? formatCurrency(totalBalance, currency) : '$ •••••'}
            </div>

            {/* Monthly growth badge */}
            {monthIncome > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 13 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: theme.badgeBg, borderRadius: 22, padding: '5px 12px 5px 5px',
                  fontSize: 13, fontWeight: 700, color: tc,
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: isPositive ? theme.dotBg : '#c53030',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width={11} height={11} viewBox="0 0 11 11" fill="none">
                      <path
                        d={isPositive ? 'M2 8.5L8 2.5M8 2.5H4M8 2.5V6.5' : 'M2 2.5L8 8.5M8 8.5H4M8 8.5V4.5'}
                        stroke="#fff" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {revealed ? `${isPositive ? '+' : ''}${savingsRate.toFixed(1)}%` : '•••'}
                </div>
                <span style={{ fontSize: 13, color: theme.subColor, fontWeight: 500 }}>
                  {revealed
                    ? `(${isPositive ? '+' : '-'}${formatCurrency(Math.abs(monthNet), currency)}) this month`
                    : '(•••) this month'}
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/dashboard/ledger" style={{
                flex: 1, height: 42, borderRadius: 21,
                background: theme.btnBg, border: `1px solid ${theme.btnBorder}`,
                color: tc, fontSize: 13.5, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                textDecoration: 'none',
              }}>
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path d="M12 2L5.5 8.5M5.5 8.5H9.5M5.5 8.5V4.5"
                    stroke={tc} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Income
              </Link>
              <Link href="/dashboard/accounts" style={{
                flex: '0 0 48px', height: 42, borderRadius: 21,
                background: theme.btnBg, border: `1px solid ${theme.btnBorder}`,
                color: tc, display: 'flex', alignItems: 'center', justifyContent: 'center',
                textDecoration: 'none',
              }}>
                <svg width={15} height={15} viewBox="0 0 15 15" fill="none">
                  <path d="M1 10L4.5 6L8 9.5L14 3.5"
                    stroke={tc} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link href="/dashboard/ledger" style={{
                flex: 1, height: 42, borderRadius: 21,
                background: theme.btnBg, border: `1px solid ${theme.btnBorder}`,
                color: tc, fontSize: 13.5, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                textDecoration: 'none',
              }}>
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path d="M2 12L8.5 5.5M8.5 5.5H4.5M8.5 5.5V9.5"
                    stroke={tc} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Expense
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom stitch */}
        <div style={{
          position: 'absolute', bottom: 9, left: 18, right: 18,
          borderBottom: '1.5px dashed rgba(255,255,255,0.20)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 10,
        }} />
      </div>
    </div>
  )
}

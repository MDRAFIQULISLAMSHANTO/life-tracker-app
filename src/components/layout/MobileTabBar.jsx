'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, TrendingDown, TrendingUp, ArrowLeftRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

const ACTIONS = [
  { label: 'Income',   Icon: TrendingDown,  href: '/dashboard/income',   bg: '#22c55e', glow: 'rgba(34,197,94,0.5)'   },
  { label: 'Transfer', Icon: ArrowLeftRight, href: '/dashboard/accounts', bg: '#6366f1', glow: 'rgba(99,102,241,0.5)'  },
  { label: 'Expense',  Icon: TrendingUp,     href: '/dashboard/expenses', bg: '#ef4444', glow: 'rgba(239,68,68,0.5)'   },
]

export default function MobileTabBar() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const pillRefs = useRef([])
  const backdropRef = useRef(null)

  useEffect(() => {
    import('gsap').then(({ gsap }) => {
      const pills = pillRefs.current.filter(Boolean)
      if (open && pills.length) {
        if (backdropRef.current) {
          gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.18 })
        }
        gsap.fromTo(pills,
          { y: 18, opacity: 0, scale: 0.82 },
          { y: 0, opacity: 1, scale: 1, duration: 0.3, stagger: 0.07, ease: 'back.out(2)' }
        )
      }
    }).catch(() => {})
  }, [open])

  const go = (href) => {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          ref={backdropRef}
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Action pills */}
      {open && (
        <div
          className="fixed z-50 lg:hidden flex flex-col gap-2.5"
          style={{
            bottom: 'calc(max(1.5rem, env(safe-area-inset-bottom)) + 72px)',
            right: '1.25rem',
            alignItems: 'flex-end',
          }}
        >
          {ACTIONS.map(({ label, Icon, href, bg, glow }, i) => (
            <button
              key={label}
              ref={el => { pillRefs.current[i] = el }}
              type="button"
              onClick={() => go(href)}
              className="flex items-center gap-3 rounded-full pl-2 pr-5 py-2 text-white font-bold text-sm transition-all active:scale-95"
              style={{
                background: 'rgba(15,15,22,0.90)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: `0 8px 28px ${glow}, 0 2px 8px rgba(0,0,0,0.3)`,
              }}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: bg, boxShadow: `0 4px 12px ${glow}` }}
              >
                <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
              </span>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="lg:hidden fixed z-50 flex items-center justify-center rounded-full text-white"
        style={{
          width: 56,
          height: 56,
          bottom: 'max(1.5rem, calc(env(safe-area-inset-bottom) + 1rem))',
          right: '1.25rem',
          background: open
            ? 'rgba(15,15,22,0.90)'
            : 'linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)',
          boxShadow: open
            ? '0 4px 16px rgba(0,0,0,0.4)'
            : '0 8px 28px rgba(99,102,241,0.52)',
          backdropFilter: open ? 'blur(24px)' : 'none',
          WebkitBackdropFilter: open ? 'blur(24px)' : 'none',
          border: open ? '1px solid rgba(255,255,255,0.10)' : 'none',
          transition: 'background 0.2s ease, box-shadow 0.2s ease',
        }}
        aria-label={open ? 'Close' : 'Quick add'}
      >
        <Plus
          className="h-7 w-7"
          strokeWidth={2.5}
          style={{ transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)', transform: open ? 'rotate(45deg)' : 'none' }}
        />
      </button>
    </>
  )
}

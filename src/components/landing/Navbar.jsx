'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, Zap } from 'lucide-react'

const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(250,251,252,0.96)' : 'rgba(244,245,247,0.80)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              L
            </div>
            <span className="font-extrabold text-base tracking-tight" style={{ color: '#0f0f1a' }}>Livio</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}
                className="text-sm font-semibold transition-colors hover:opacity-70"
                style={{ color: '#64748b' }}>
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button type="button" onClick={() => router.push('/login')}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-all hover:opacity-70"
              style={{ color: '#64748b' }}>
              Sign in
            </button>
            <button type="button" onClick={() => router.push('/signup')}
              className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
              <Zap className="w-3.5 h-3.5" />
              Get started
            </button>
          </div>

          {/* Mobile menu btn */}
          <button type="button" onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)', color: '#0f0f1a' }}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 space-y-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm font-semibold rounded-xl px-3 transition-colors hover:bg-black/4"
              style={{ color: '#0f0f1a' }}>
              {label}
            </Link>
          ))}
          <div className="pt-3 space-y-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button type="button" onClick={() => { setMenuOpen(false); router.push('/login') }}
              className="w-full py-2.5 text-sm font-bold rounded-xl text-left px-3"
              style={{ color: '#64748b' }}>
              Sign in
            </button>
            <button type="button" onClick={() => { setMenuOpen(false); router.push('/signup') }}
              className="w-full py-3 text-sm font-bold rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              Get started free
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

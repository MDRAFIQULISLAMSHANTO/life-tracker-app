'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, Zap } from 'lucide-react'
import Logo from '../common/Logo'

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
          <Link href="/" className="flex items-center">
            <Logo height={38} />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}
                className="text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#64748b' }}>
                {label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button type="button" onClick={() => router.push('/login')}
              className="text-sm font-bold px-4 py-2 rounded-xl transition-opacity hover:opacity-70"
              style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign in
            </button>
            <button type="button" onClick={() => router.push('/signup')}
              className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              <Zap className="w-3.5 h-3.5" />
              Get started
            </button>
          </div>

          <button type="button" onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-xl transition-colors"
            style={{ background: 'rgba(0,0,0,0.04)', color: '#0f0f1a', border: 'none', cursor: 'pointer' }}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 pt-2 space-y-1" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className="block py-2.5 text-sm font-semibold rounded-xl px-3"
              style={{ color: '#0f0f1a' }}>
              {label}
            </Link>
          ))}
          <div className="pt-3 space-y-2" style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 8 }}>
            <button type="button" onClick={() => { setMenuOpen(false); router.push('/login') }}
              className="w-full py-2.5 text-sm font-bold rounded-xl text-left px-3"
              style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Sign in
            </button>
            <button type="button" onClick={() => { setMenuOpen(false); router.push('/signup') }}
              className="w-full py-3 text-sm font-bold rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Get started free
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

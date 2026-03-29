'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import Logo from '../common/Logo'

const navLinks = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-shadow ${
        scrolled ? 'bg-white/95 backdrop-blur-sm border-neutral-200 shadow-sm' : 'bg-white/90 backdrop-blur-sm border-neutral-200/80'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg">
            <Logo variant="full" size="md" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900 min-h-[40px] px-2"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="min-h-[40px] px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-600 shadow-sm"
            >
              Create account
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl border border-neutral-200 bg-white text-neutral-800"
            aria-expanded={mobileMenuOpen}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-3 text-base font-medium text-neutral-800"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 mt-2 border-t border-neutral-100 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                router.push('/login')
              }}
              className="w-full py-3 text-left text-base font-medium text-neutral-700"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false)
                router.push('/signup')
              }}
              className="w-full min-h-[48px] rounded-xl bg-primary text-white text-base font-semibold"
            >
              Create account
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}

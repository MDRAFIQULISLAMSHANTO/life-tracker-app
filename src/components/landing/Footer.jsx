'use client'

import Link from 'next/link'
import Logo from '../common/Logo'

const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Sign in' },
]

export default function Footer() {
  return (
    <footer
      className="py-10 sm:py-12"
      style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Logo + tagline */}
          <div>
            <div className="mb-2">
              <Logo height={42} />
            </div>
            <p className="text-xs max-w-xs leading-relaxed" style={{ color: '#94a3b8' }}>
              Personal finance and productivity. Fast on every device.
            </p>
          </div>

          {/* Links */}
          <nav>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm font-semibold transition-opacity hover:opacity-70"
                    style={{ color: '#64748b' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div
          className="mt-8 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
          style={{ borderTop: '1px solid rgba(0,0,0,0.06)', color: '#94a3b8' }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <p>© {new Date().getFullYear()} Livio — All rights reserved</p>
            <p>
              Designed &amp; built by{' '}
              <a href="https://www.rishanto.com" target="_blank" rel="noopener noreferrer"
                className="font-bold transition-opacity hover:opacity-70" style={{ color: '#6366f1' }}>
                Rishanto
              </a>
            </p>
          </div>
          <div className="flex gap-5">
            <Link href="/contact" className="hover:opacity-70 transition-opacity">Support</Link>
            <Link href="/pricing" className="hover:opacity-70 transition-opacity">Plans</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

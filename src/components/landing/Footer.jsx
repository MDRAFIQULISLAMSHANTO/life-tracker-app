'use client'

import Link from 'next/link'
import Logo from '../common/Logo'

const links = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
  { href: '/login', label: 'Sign in' },
]

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
          <div>
            <Logo variant="full" size="sm" />
            <p className="mt-3 text-sm text-neutral-500 max-w-xs leading-relaxed">
              Personal finance and productivity. Built to stay fast and easy on every device.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {links.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm font-medium text-neutral-600 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="mt-10 pt-8 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm text-neutral-500">
          <p>© {new Date().getFullYear()} Livio</p>
          <div className="flex gap-6">
            <Link href="/contact" className="hover:text-neutral-800">
              Support
            </Link>
            <Link href="/pricing" className="hover:text-neutral-800">
              Plans
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

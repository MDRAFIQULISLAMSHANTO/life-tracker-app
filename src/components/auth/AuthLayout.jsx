'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Logo from '../common/Logo'

function AuthLayout({ children, title, subtitle }) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg-alt)' }}>
      <div className="w-full max-w-md">

        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-semibold mb-6 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-2)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="flex justify-center mb-2">
            <Logo height={44} />
          </div>
          {subtitle && <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="glass-card">
          {title && (
            <h2 className="text-lg font-extrabold mb-5 text-center" style={{ color: 'var(--text-1)' }}>{title}</h2>
          )}
          {children}
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--text-3)' }}>
          Secured by Firebase Authentication
        </p>
      </div>
    </div>
  )
}

export default AuthLayout

'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Logo from '../common/Logo'

function AuthLayout({ children, title, subtitle }) {
  const router = useRouter()

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      // Was a hardcoded light gradient, which left a white card and invisible
      // logo whenever the app was in dark mode.
      style={{ background: 'var(--bg)' }}
    >
      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: '-10%', right: '-10%', width: 400, height: 400,
        borderRadius: '50%', background: 'rgba(var(--accent-rgb),0.10)', filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', left: '-10%', width: 350, height: 350,
        borderRadius: '50%', background: 'rgba(236,72,153,0.07)', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div className="w-full max-w-md relative">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm font-semibold mb-8 transition-opacity hover:opacity-60"
          style={{ color: 'var(--text-2)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </button>

        {/* Logo + subtitle */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo height={56} />
          </div>
          {subtitle && (
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-2)' }}>{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            boxShadow: 'var(--card-shadow), 0 20px 60px rgba(var(--accent-rgb),0.10)',
          }}
        >
          {title && (
            <h2 className="text-xl font-extrabold mb-6 text-center" style={{ color: 'var(--text-1)' }}>
              {title}
            </h2>
          )}
          {children}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-3)' }}>
          Secured by Firebase Authentication
        </p>
      </div>
    </div>
  )
}

export default AuthLayout

'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

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

        {/* Logo + brand */}
        <div className="text-center mb-7">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl mx-auto mb-3 shadow-lg"
            style={{ background: 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, #000 30%))' }}
          >
            L
          </div>
          <h1 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>Livio</h1>
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

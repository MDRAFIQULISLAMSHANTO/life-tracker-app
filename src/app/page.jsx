'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import LandingValueSection from '../components/landing/LandingValueSection'
import Footer from '../components/landing/Footer'
import Logo from '../components/common/Logo'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f5f7',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <style>{`
          @keyframes livio-rise {
            from { opacity: 0; transform: translateY(10px) scale(0.96); }
            to   { opacity: 1; transform: translateY(0)   scale(1); }
          }
          @keyframes livio-pulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.45; }
          }
          .livio-preloader-logo {
            animation: livio-rise 0.55s cubic-bezier(0.34,1.56,0.64,1) both;
          }
          .livio-preloader-dot {
            animation: livio-pulse 1.4s ease-in-out infinite;
          }
        `}</style>
        <div className="livio-preloader-logo">
          <Logo height={48} />
        </div>
        <div className="livio-preloader-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1' }} />
      </div>
    )
  }

  return (
    /* No overflow:hidden, no fixed height — body scrolls naturally */
    <div style={{ background: '#f4f5f7' }}>
      <Navbar />
      <Hero />
      <LandingValueSection />
      <Footer />
    </div>
  )
}

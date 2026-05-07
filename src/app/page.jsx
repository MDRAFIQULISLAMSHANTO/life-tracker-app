'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/landing/Navbar'
import Hero from '../components/landing/Hero'
import LandingValueSection from '../components/landing/LandingValueSection'
import Footer from '../components/landing/Footer'

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#f4f5f7' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl animate-pulse"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          />
          <p className="text-sm font-semibold" style={{ color: '#64748b' }}>Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#f4f5f7' }}
    >
      <Navbar />
      <main className="flex-1">
        <Hero />
        <LandingValueSection />
      </main>
      <Footer />
    </div>
  )
}

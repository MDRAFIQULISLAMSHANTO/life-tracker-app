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
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <LandingValueSection />
      </main>
      <Footer />
    </div>
  )
}

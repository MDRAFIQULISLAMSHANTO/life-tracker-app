'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import AuthLayout from '../../components/auth/AuthLayout'
import SignupForm from '../../components/auth/SignupForm'
import FirebaseSetupNotice from '../../components/auth/FirebaseSetupNotice'

export default function SignupPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [firebaseReady, setFirebaseReady] = useState(false)

  useEffect(() => {
    // Check if Firebase is configured
    const hasFirebaseConfig = 
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

    setFirebaseReady(hasFirebaseConfig)

    // Redirect authenticated users away from signup page
    if (!loading && user) {
      router.replace('/dashboard')
    }
  }, [user, loading, router])

  if (!firebaseReady) {
    return <FirebaseSetupNotice />
  }

  if (loading) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-text-secondary">Loading...</div>
        </div>
      </AuthLayout>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <AuthLayout title="Create Account" subtitle="Get started with Livio">
      <SignupForm />
    </AuthLayout>
  )
}

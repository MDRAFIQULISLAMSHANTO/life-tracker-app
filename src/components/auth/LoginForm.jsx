'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import GoogleLoginButton from './GoogleLoginButton'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { user, error: loginError } = await login(email, password)

    if (loginError) {
      setError(getErrorMessage(loginError))
      setLoading(false)
      return
    }

    if (user) {
      // Redirect to personalized dashboard after login
      router.replace('/dashboard')
    }
  }

  const getErrorMessage = (error) => {
    if (error.includes('user-not-found')) {
      return 'No account found with this email address.'
    }
    if (error.includes('wrong-password') || error.includes('invalid-credential')) {
      return 'Incorrect password. Please try again.'
    }
    if (error.includes('too-many-requests')) {
      return 'Too many failed attempts. Please try again later.'
    }
    if (error.includes('invalid-email')) {
      return 'Please enter a valid email address.'
    }
    return 'Login failed. Please try again.'
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            required
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background-card text-text-secondary">Or continue with</span>
        </div>
      </div>

      <GoogleLoginButton />

      <p className="text-center text-sm text-text-secondary">
        Don't have an account?{' '}
        <Link href="/signup" className="text-primary font-medium hover:text-primary-600">
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default LoginForm


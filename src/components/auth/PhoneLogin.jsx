'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../context/AuthContext'

// Check if Firebase is configured
const isFirebaseConfigured = () => {
  return auth && 
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
}

function PhoneLogin() {
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState(null)
  const recaptchaVerifierRef = useRef(null)
  const recaptchaContainerRef = useRef(null)
  const router = useRouter()
  const { verifyOTP } = useAuth()

  useEffect(() => {
    // Cleanup recaptcha on unmount
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear()
      }
    }
  }, [])

  const setupRecaptcha = async () => {
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear()
    }

    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved, will proceed with sending OTP
      },
      'expired-callback': () => {
        setError('reCAPTCHA expired. Please try again.')
      },
    })
  }

  const handleSendOTP = async (e) => {
    e?.preventDefault()
    setError('')
    
    if (!isFirebaseConfigured()) {
      setError('Firebase is not configured. Please set up your .env.local file.')
      return
    }
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid phone number with country code.')
      return
    }

    // Format phone number (ensure it starts with +)
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`

    setLoading(true)

    try {
      await setupRecaptcha()

      const confirmation = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaVerifierRef.current
      )

      setConfirmationResult(confirmation)
      setStep('otp')
      setError('')
    } catch (error) {
      setError(getErrorMessage(error.message))
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e) => {
    e?.preventDefault()
    setError('')
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code.')
      return
    }

    if (!confirmationResult) {
      setError('Session expired. Please request a new OTP.')
      setStep('phone')
      return
    }

    setLoading(true)

    const { user, error: verifyError } = await verifyOTP(confirmationResult, otp)

    if (verifyError) {
      setError(getErrorMessage(verifyError))
      setLoading(false)
      return
    }

    if (user) {
      router.push('/dashboard')
    }
  }

  const handleResendOTP = () => {
    setOtp('')
    setError('')
    handleSendOTP()
  }

  const getErrorMessage = (error) => {
    if (error.includes('invalid-phone-number')) {
      return 'Invalid phone number. Please check and try again.'
    }
    if (error.includes('too-many-requests')) {
      return 'Too many requests. Please try again later.'
    }
    if (error.includes('session-expired')) {
      return 'Session expired. Please request a new OTP.'
    }
    if (error.includes('invalid-verification-code')) {
      return 'Invalid OTP code. Please try again.'
    }
    return 'An error occurred. Please try again.'
  }

  if (step === 'otp') {
    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-text-primary mb-2">
            Enter OTP Code
          </label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center text-2xl tracking-widest font-medium"
            required
            disabled={loading}
          />
          <p className="mt-2 text-xs text-text-secondary text-center">
            Enter the 6-digit code sent to {phoneNumber}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleVerifyOTP}
          disabled={loading || otp.length !== 6}
          className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              setStep('phone')
              setOtp('')
              setError('')
              if (recaptchaVerifierRef.current) {
                recaptchaVerifierRef.current.clear()
              }
            }}
            className="flex-1 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Change number
          </button>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={loading}
            className="flex-1 py-2 text-sm text-primary font-medium hover:text-primary-600 transition-colors disabled:opacity-50"
          >
            Resend OTP
          </button>
        </div>

        <div id="recaptcha-container"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
          Phone Number
        </label>
        <input
          id="phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-text-secondary">
          Include country code (e.g., +1 for US, +880 for BD)
        </p>
      </div>

      <button
        type="button"
        onClick={handleSendOTP}
        disabled={loading || !phoneNumber}
        className="w-full py-3 border-2 border-gray-300 rounded-xl font-medium text-text-primary hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        <span>{loading ? 'Sending OTP...' : 'Continue with Phone'}</span>
      </button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div id="recaptcha-container" ref={recaptchaContainerRef}></div>
    </div>
  )
}

export default PhoneLogin
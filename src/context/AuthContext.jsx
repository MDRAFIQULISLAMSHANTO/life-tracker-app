'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    if (!auth) {
      return { user: null, error: 'Firebase is not configured. Please set up your .env.local file.' }
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return { user: userCredential.user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  }

  const signup = async (email, password) => {
    if (!auth) {
      return { user: null, error: 'Firebase is not configured. Please set up your .env.local file.' }
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      return { user: userCredential.user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  }

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      return { user: null, error: 'Firebase is not configured. Please set up your .env.local file.' }
    }
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return { user: result.user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  }

  const loginWithPhone = async (phoneNumber, recaptchaVerifier) => {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)
      return { confirmationResult, error: null }
    } catch (error) {
      return { confirmationResult: null, error: error.message }
    }
  }

  const verifyOTP = async (confirmationResult, otp) => {
    try {
      const userCredential = await confirmationResult.confirm(otp)
      return { user: userCredential.user, error: null }
    } catch (error) {
      return { user: null, error: error.message }
    }
  }

  const logout = async () => {
    if (!auth) {
      return { error: 'Firebase is not configured.' }
    }
    try {
      await firebaseSignOut(auth)
      return { error: null }
    } catch (error) {
      return { error: error.message }
    }
  }

  const value = {
    user,
    loading,
    login,
    signup,
    loginWithGoogle,
    loginWithPhone,
    verifyOTP,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import GoogleLoginButton from './GoogleLoginButton'

const inputStyle = {
  width: '100%',
  padding: '12px 16px 12px 44px',
  border: '1.5px solid var(--card-border)',
  borderRadius: 14,
  fontSize: 14,
  color: 'var(--text-1)',
  background: 'var(--input-bg)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
}

const inputFocusStyle = {
  borderColor: 'var(--accent)',
  boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
  background: 'var(--card-bg)',
}

function InputField({ id, type, value, onChange, placeholder, icon: Icon, disabled, showToggle, onToggle }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <Icon
        style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          width: 17, height: 17, color: focused ? 'var(--accent)' : 'var(--text-3)', transition: 'color 0.15s',
        }}
      />
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...inputStyle, ...(focused ? inputFocusStyle : {}), paddingRight: showToggle ? 44 : 16 }}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'var(--text-3)', display: 'flex', alignItems: 'center',
          }}
        >
          {type === 'password' ? <Eye style={{ width: 16, height: 16 }} /> : <EyeOff style={{ width: 16, height: 16 }} />}
        </button>
      )}
    </div>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
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
    if (user) router.replace('/dashboard')
  }

  const getErrorMessage = (error) => {
    if (error.includes('user-not-found')) return 'No account found with this email.'
    if (error.includes('wrong-password') || error.includes('invalid-credential')) return 'Incorrect password.'
    if (error.includes('too-many-requests')) return 'Too many attempts. Try again later.'
    if (error.includes('invalid-email')) return 'Enter a valid email address.'
    return 'Login failed. Please try again.'
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
            Email
          </label>
          <InputField
            id="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" icon={Mail} disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>
            Password
          </label>
          <InputField
            id="password" type={showPass ? 'text' : 'password'} value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" icon={Lock} disabled={loading}
            showToggle onToggle={() => setShowPass((v) => !v)}
          />
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(var(--danger-rgb),0.08)', border: '1px solid rgba(var(--danger-rgb),0.22)', borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 0.2,
            boxShadow: loading ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
            transition: 'all 0.2s', opacity: loading ? 0.8 : 1,
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>or</span>
        <div style={{ flex: 1, height: 1, background: 'var(--card-border)' }} />
      </div>

      <GoogleLoginButton />

      <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-2)' }}>
        No account?{' '}
        <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default LoginForm

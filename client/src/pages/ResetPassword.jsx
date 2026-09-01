import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import Toast, { useToast } from '../components/Toast'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const [email, setEmail] = useState(params.get('email') || '')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [isResending, setIsResending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  useEffect(() => {
  if (countdown <= 0) return

  const timer = setInterval(() => {
    setCountdown(prev => prev - 1)
  }, 1000)

  return () => clearInterval(timer)
}, [countdown])

const handleResendOtp = async () => {
  setIsResending(true)

  try {
    await fetch('http://localhost:3001/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.trim()
      })
    })

    toast('If an account exists, a new OTP has been sent.')

    setCountdown(30)
  } catch (err) {
    toast('Failed to resend OTP')
  } finally {
    setIsResending(false)
  }
}

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email.trim()) {
      toast('Please enter your email')
      return
    }
    if (!otp || otp.length !== 6) {
      toast('Please enter the 6-digit OTP code')
      return
    }
    if (!password) {
      toast('Please enter a new password')
      return
    }
    if (password !== confirmPassword) {
      toast('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          password,
          confirmPassword
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast('Password successfully reset! Redirecting to login...')
        setTimeout(() => navigate('/login'), 1800)
      } else {
        const errorMsg = data.errors ? data.errors[0] : (data.message || 'Password reset failed')
        toast(errorMsg)
      }
    } catch (err) {
      toast('Network error during password reset')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#ffffff', border: '1px solid #E5E5EA', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <img src="/assets/images/logo-blue.png" alt="logo" style={{ height: 44, objectFit: 'contain' }} />
          <span style={{ color: '#3E66FB', fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>hiprofile</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: 8 }}>
          Change Password
        </h2>
        <div
            style={{
              background: '#EEF4FF',
              border: '1px solid #BFD2FF',
              borderRadius: 8,
              padding: 14,
              marginBottom: 20,
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 600, color: '#2457D6' }}>
              Check your email
            </div>

            <div
              style={{
                marginTop: 6,
                color: '#555',
                fontSize: '0.9rem',
                lineHeight: 1.5
              }}
            >
              We've sent a 6-digit verification code <strong>if an account exists</strong> for:

              <br /><br />

              <strong>{email}</strong>

              <br /><br />

              Please check your Inbox and Spam folder.
            </div>
          </div>

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: 14 }}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                background: '#F6F6F6',
                border: '1px solid #E5E5EA',
                borderRadius: 8,
                fontSize: '0.98rem',
                color: '#000000',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* OTP Code */}
          <div style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="6-Digit OTP Code"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              required
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                background: '#F6F6F6',
                border: '1px solid #E5E5EA',
                borderRadius: 8,
                fontSize: '1.1rem',
                fontWeight: 700,
                letterSpacing: 4,
                textAlign: 'center',
                color: '#000000',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18
            }}
          >

            <button
              type="button"
              disabled={countdown > 0 || isResending}
              onClick={handleResendOtp}
              style={{
                background: 'none',
                border: 'none',
                color: countdown > 0 ? '#999' : '#3E66FB',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                fontWeight: 600
              }}
            >
              {countdown > 0
                ? `Resend OTP in ${countdown}s`
                : isResending
                ? 'Sending...'
                : 'Resend OTP'}
            </button>

            <Link
              to="/forgot-password"
              style={{
                color: '#3E66FB',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              Change Email
            </Link>

          </div>

          {/* Password Input */}
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="New Password (Min 8 chars, Upper, Number, Special)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                height: 48,
                padding: '0 44px 0 16px',
                background: '#F6F6F6',
                border: '1px solid #E5E5EA',
                borderRadius: 8,
                fontSize: '0.98rem',
                color: '#000000',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93' }}
            >
              {showPw ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 20 }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                background: '#F6F6F6',
                border: '1px solid #E5E5EA',
                borderRadius: 8,
                fontSize: '0.98rem',
                color: '#000000',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: 50,
              background: '#3E66FB',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginBottom: 16
            }}
          >
            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          Back to <Link to="/login" style={{ color: '#3E66FB', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
        </div>

      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

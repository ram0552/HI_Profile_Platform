import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Toast, { useToast } from '../components/Toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      toast('Please enter your email')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast('If an account exists, a 6-digit OTP code was sent!')
        setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`), 1500)
      } else {
        toast(data.message || 'Failed to request OTP')
      }
    } catch (err) {
      toast('Network error requesting password reset')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#ffffff', border: '1px solid #E5E5EA', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
          <img src="/assets/images/logo-blue.png" alt="logo" style={{ height: 44, objectFit: 'contain' }} />
          <span style={{ color: '#3E66FB', fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>hiprofile</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: 8 }}>
          Forgot Password
        </h2>
        <p style={{ color: '#666', fontSize: '0.92rem', marginBottom: 24, lineHeight: 1.4 }}>
          Enter your registered email address below to receive a 6-digit OTP code.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                height: 50,
                padding: '0 16px',
                background: '#F6F6F6',
                border: '1px solid #E5E5EA',
                borderRadius: 8,
                fontSize: '1rem',
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
            {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </form>

        <div style={{ fontSize: '0.9rem', color: '#666' }}>
          Remembered your password? <Link to="/login" style={{ color: '#3E66FB', fontWeight: 700, textDecoration: 'none' }}>Log In</Link>
        </div>

      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

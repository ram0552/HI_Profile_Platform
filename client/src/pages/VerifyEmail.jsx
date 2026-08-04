import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Toast, { useToast } from '../components/Toast'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('Verifying your email token...')
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  // Guard against React 18/19 Strict Mode double execution
  const hasExecutedRef = useRef(false)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Verification token missing from URL.')
      return
    }

    if (hasExecutedRef.current) {
      return
    }
    hasExecutedRef.current = true

    const verify = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        const data = await res.json()

        setCode(data.code || '')

        if (res.ok && data.success) {
          setStatus('success')
          if (data.code === 'EMAIL_ALREADY_VERIFIED') {
            setMessage('Your email address is already verified! Redirecting to login...')
            toast('Email already verified!')
          } else {
            setMessage('Email verified successfully! Redirecting to login...')
            toast('Email verified!')
          }
          setTimeout(() => navigate('/login'), 2200)
        } else {
          // If code is EMAIL_ALREADY_VERIFIED, treat as success
          if (data.code === 'EMAIL_ALREADY_VERIFIED') {
            setStatus('success')
            setMessage('Your account is already verified. You can log in directly.')
            toast('Account already verified!')
            setTimeout(() => navigate('/login'), 2200)
          } else {
            setStatus('error')
            setMessage(data.message || 'Verification token is invalid or expired.')
            toast(data.message || 'Verification failed')
          }
        }
      } catch (err) {
        setStatus('error')
        setMessage('Network error verifying email. Please check your connection.')
        toast('Network error')
      }
    }

    verify()
  }, [token, navigate])

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#ffffff', border: '1px solid #E5E5EA', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
          <img src="/assets/images/logo-blue.png" alt="logo" style={{ height: 44, objectFit: 'contain' }} />
          <span style={{ color: '#3E66FB', fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>hiprofile</span>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: '#111', marginBottom: 16 }}>
          Email Verification
        </h2>

        {status === 'verifying' && (
          <div>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</div>
            <p style={{ color: '#666', fontSize: '1rem' }}>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <p style={{ color: '#10B981', fontWeight: 600, fontSize: '1.05rem', marginBottom: 20 }}>{message}</p>
            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                height: 48,
                background: '#3E66FB',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>❌</div>
            <p style={{ color: '#EF4444', fontWeight: 600, fontSize: '1rem', marginBottom: 20 }}>{message}</p>
            
            {code === 'TOKEN_EXPIRED' && (
              <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: 16 }}>
                Need a new verification link? Try registering or logging in to resend verification.
              </p>
            )}

            <button
              onClick={() => navigate('/login')}
              style={{
                width: '100%',
                height: 48,
                background: '#3E66FB',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

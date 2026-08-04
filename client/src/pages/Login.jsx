import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast, { useToast } from '../components/Toast'
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast('Please fill in all fields')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast('Login successful! 🎉')
        loginUser(data.data.user, data.data.accessToken, data.data.refreshToken)
        setTimeout(() => navigate('/upload'), 1000)
      } else {
        const errorMsg = data.message || 'Login failed'
        toast(errorMsg)
      }
    } catch (err) {
      toast('Network error during login')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogle = () => {
    window.location.href = 'http://localhost:3001/api/v1/auth/google'
  }

  const handleGitHub = () => {
    window.location.href = 'http://localhost:3001/api/v1/auth/github'
  }

  return (
    <div style={{ background: '#F8F9FD', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      {/* Outer Blue Card */}
      <div className="login-blue-card" style={{ width: '100%', maxWidth: 440, background: '#3E66FB', borderRadius: 20, padding: 32, boxSizing: 'border-box', boxShadow: '0 12px 32px rgba(62,102,251,0.2)' }}>
        
        {/* White Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60, marginBottom: 16 }}>
          <img src="/assets/images/logo-blue.png" alt="logo" style={{ height: 50, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* Title */}
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', marginBottom: 28, textAlign: 'center', letterSpacing: '-0.02em' }}>Log In to your Account</h1>

        {/* Inner White Card */}
        <div className="login-white-card" style={{ background: '#ffffff', borderRadius: 16, padding: 24 }}>
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div style={{ position: 'relative', width: '100%', marginBottom: 14 }}>
              <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: '#8E8E93' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: 50,
                  padding: '0 16px 0 48px',
                  background: '#F6F6F6',
                  border: '1px solid #E5E5EA',
                  borderRadius: 8,
                  fontSize: '1rem',
                  color: '#000000',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ position: 'relative', width: '100%', marginBottom: 10 }}>
              <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: '#8E8E93' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: 50,
                  padding: '0 48px 0 48px',
                  background: '#F6F6F6',
                  border: '1px solid #E5E5EA',
                  borderRadius: 8,
                  fontSize: '1rem',
                  color: '#000000',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: '#8E8E93'
                }}
              >
                 {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#3E66FB', textDecoration: 'none', fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
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
                marginBottom: 20,
                transition: 'background 0.2s'
              }}
            >
              {isSubmitting ? 'Logging In...' : 'Log In'}
            </button>
          </form>

          {/* Separator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
            <span style={{ color: '#8E8E93', fontSize: '0.82rem', margin: '0 12px', fontWeight: 500 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
          </div>

          {/* OAuth Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={handleGoogle}
              type="button"
              style={{
                width: '100%',
                height: 46,
                background: '#ffffff',
                color: '#1C1C1E',
                border: '1px solid #D1D1D6',
                borderRadius: 8,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Google
            </button>

            <button
              onClick={handleGitHub}
              type="button"
              style={{
                width: '100%',
                height: 46,
                background: '#24292E',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: '0.88rem', color: '#666' }}>
            Don't have an account? <span onClick={() => navigate('/claim')} style={{ color: '#3E66FB', fontWeight: 700, cursor: 'pointer' }}>Claim Profile</span>
          </div>

        </div>

      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [params] = useSearchParams()
  const { claimedUsername } = useOnboarding()
  
  const reservationId = params.get('reservationId') || ''
  const urlUsername = params.get('username') || claimedUsername || ''
  const oauthProvider = params.get('oauth') || ''
  
  const [fullName, setFullName] = useState(params.get('fullName') || '')
  const [username, setUsername] = useState(urlUsername || 'user_' + Math.floor(Math.random() * 10000))
  const [email, setEmail] = useState(params.get('email') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPw, setShowPw] = useState(false)
  
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  useEffect(() => {
    if (oauthProvider) {
      toast(`OAuth login via ${oauthProvider}. Complete registration to continue.`)
    }
  }, [oauthProvider])

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!fullName.trim()) {
      toast('Please enter your full name')
      return
    }
    if (!username.trim()) {
      toast('Username is required')
      return
    }
    if (!email.trim()) {
      toast('Please enter a valid email')
      return
    }
    if (!password) {
      toast('Please enter a password')
      return
    }
    if (password !== confirmPassword) {
      toast('Passwords do not match')
      return
    }
    if (!termsAccepted) {
      toast('You must agree to the Terms & Conditions')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          username: username.trim(),
          email: email.trim(),
          password,
          confirmPassword,
          termsAccepted: true,
          reservationId
        })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast('Account created! Please check your email to verify your account.')
        setTimeout(() => navigate('/login'), 2000)
      } else {
        const errorMsg = data.errors ? data.errors[0] : (data.message || 'Registration failed')
        toast(errorMsg)
      }
    } catch (err) {
      toast('Network error during registration')
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
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ width: '100%', maxWidth: 440, textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        
        {/* Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 28 }}>
          <img src="/assets/images/logo-blue.png" alt="logo" style={{ height: 48, objectFit: 'contain' }} />
          <span style={{ color: '#3E66FB', fontSize: '2.4rem', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>hiprofile</span>
        </div>

        {/* Headline */}
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 600, color: '#A0A0A5', marginBottom: 24, letterSpacing: '-0.02em' }}>
          Claiming <span style={{ color: '#000000', fontWeight: 700 }}>hiprofile.bio/{username}</span> 🥳
        </h2>

        {oauthProvider && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: '10px 14px', borderRadius: 8, fontSize: '0.9rem', marginBottom: 20 }}>
            Complete your registration details to continue with {oauthProvider}.
          </div>
        )}

        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
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

          {/* Read-Only Reserved Username */}
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <input
              type="text"
              value={username}
              readOnly
              style={{
                width: '100%',
                height: 48,
                padding: '0 16px',
                background: '#EFEFEF',
                border: '1px solid #D1D1D6',
                borderRadius: 8,
                fontSize: '0.98rem',
                color: '#666',
                cursor: 'not-allowed',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '0.78rem', color: '#10B981', fontWeight: 700 }}>
              RESERVED
            </span>
          </div>

          {/* Email Input */}
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

          {/* Password Input */}
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password (Min 8 chars, 1 upper, 1 special, 1 number)"
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
            {/* <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8E8E93' }}
            >
               {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
            </button> */}
          </div>

          {/* Confirm Password Input */}
          <div style={{ marginBottom: 16 }}>
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Confirm Password"
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

          {/* Terms Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, textAlign: 'left' }}>
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={e => setTermsAccepted(e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="terms" style={{ fontSize: '0.88rem', color: '#555', cursor: 'pointer' }}>
              I agree to the <span style={{ color: '#3E66FB', fontWeight: 600 }}>Terms of Service</span> and <span style={{ color: '#3E66FB', fontWeight: 600 }}>Privacy Policy</span>
            </label>
          </div>

          {/* Register Submit Button */}
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
              fontSize: '1.05rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              marginBottom: 20,
              transition: 'background 0.2s'
            }}
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Separator */}
        {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
          <span style={{ color: '#3A3A3C', fontSize: '0.85rem', margin: '0 14px', fontWeight: 500 }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: '#E5E5EA' }} />
        </div> */}

        {/* OAuth Buttons */}
        {/* <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleGoogle}
            type="button"
            style={{
              width: '100%',
              height: 48,
              background: '#ffffff',
              color: '#1C1C1E',
              border: '1px solid #D1D1D6',
              borderRadius: 8,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.98rem',
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
            Continue with Google
          </button>

          <button
            onClick={handleGitHub}
            type="button"
            style={{
              width: '100%',
              height: 48,
              background: '#24292E',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.98rem',
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
            Continue with GitHub
          </button>
        </div> */}

        <p style={{ marginTop: 20, fontSize: '0.9rem', color: '#666' }}>
          Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#3E66FB', fontWeight: 700, cursor: 'pointer' }}>Log In</span>
        </p>

      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

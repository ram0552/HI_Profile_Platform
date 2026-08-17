import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'

export default function Claim() {
  const [username, setUsername] = useState('')
  const [isAvailable, setIsAvailable] = useState(null) // null | true | false
  const [statusMessage, setStatusMessage] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setClaimedUsername } = useOnboarding()
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  // Debounced Profile Name Check (350 ms)
  useEffect(() => {
    const val = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!val || val.length < 3) {
      setIsAvailable(null)
      setStatusMessage('')
      setIsChecking(false)
      return
    }

    setIsChecking(true)
    setStatusMessage('Checking availability...')
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/auth/username-check?username=${encodeURIComponent(val)}`)
        const data = await res.json()
        if (data.success && data.data?.available) {
          setIsAvailable(true)
          setStatusMessage('Profile name is available.')
        } else {
          setIsAvailable(false)
          setStatusMessage(data.message || 'Profile name already exists.')
        }
      } catch (err) {
        console.error('Profile name check error', err)
        setIsAvailable(false)
        setStatusMessage('Network error checking availability.')
      } finally {
        setIsChecking(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [username])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const val = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
    if (!val || val.length < 3) {
      toast('Profile name must be at least 3 characters')
      return
    }

    if (!isAvailable) {
      toast('Please choose an available profile name')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('http://localhost:3001/api/auth/username-reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: val })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const reservationId = data.data.reservationId
        setClaimedUsername(val)
        navigate(`/register?username=${encodeURIComponent(val)}&reservationId=${encodeURIComponent(reservationId)}`)
      } else {
        toast(data.message || 'Failed to reserve profile name')
        setIsAvailable(false)
        setStatusMessage(data.message || 'Profile name already exists.')
      }
    } catch (err) {
      toast('Network error reserving profile name')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 50%, #F9FAFC 0%, #F3F5FA 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '520px', textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px' }}>
            <img src="/assets/images/logo-blue.png" alt="hiprofile logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          </div>
          <span className="logo-text" style={{ color: '#3B82F6', fontSize: '1.95rem', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>hiprofile</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#111', marginBottom: '10px' }}>Claim Your Profile</h1>
        <p style={{ color: '#666', fontSize: '1rem', marginBottom: '24px' }}>Enter your desired profile name to get started</p>

        {/* Dynamic Status Message Displayed Above Input Field */}
        <div style={{ height: '28px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 600 }}>
          {isChecking && (
            <span style={{ color: '#6B7280' }}> {statusMessage}</span>
          )}
          {!isChecking && isAvailable === true && (
            <span style={{ color: '#10B981' }}> {statusMessage}</span>
          )}
          {!isChecking && isAvailable === false && (
            <span style={{ color: '#EF4444' }}> {statusMessage}</span>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="input-wrapper" style={{
            marginBottom: '20px',
            background: '#fff',
            border: isAvailable === true ? '2px solid #10B981' : isAvailable === false ? '2px solid #EF4444' : '1.5px solid #E2E2E8',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            height: '52px',
            transition: 'border-color 0.2s'
          }}>
            <span style={{ color: '#888', fontWeight: 600, fontSize: '1rem', whiteSpace: 'nowrap' }}>hiprofile.bio/</span>
            <input
              type="text"
              placeholder="yourname"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '1rem', background: 'transparent', color: '#111' }}
              aria-label="Profile name"
            />
          </div>

          {/* Continue button appears ONLY when profile name is available */}
          {!isChecking && isAvailable === true && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-claim"
              style={{
                width: '100%',
                height: '52px',
                background: '#3B82F6',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '1.05rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                animation: 'fadeInUp 0.3s cubic-bezier(0.16,1,0.3,1)'
              }}
            >
              <span>{isSubmitting ? 'Reserving...' : 'Continue'}</span>
              <span>→</span>
            </button>
          )}
        </form>

        <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '20px' }}>Free forever · No credit card required</p>
      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

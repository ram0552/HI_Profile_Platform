import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'

const PLATFORMS = [
  { id: 'twitter',   label: 'Twitter',   bg: '#55ACEE', icon: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg> },
  { id: 'instagram', label: 'Instagram', bg: 'linear-gradient(135deg,#c32aa3,#f57d05)', icon: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { id: 'linkedin',  label: 'LinkedIn',  bg: '#0077B5', icon: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
  { id: 'github',    label: 'GitHub',    bg: '#000000', icon: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg> },
  { id: 'youtube',   label: 'YouTube',   bg: '#E52D27', icon: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg> },
  { id: 'dribbble',  label: 'Dribbble',  bg: '#EA4C89', icon: <svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308a10.19 10.19 0 004.396-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.017-8.04 6.404a10.161 10.161 0 006.29 2.166c1.42 0 2.77-.29 4.006-.82zm-11.62-2.logout c.29-.48 3.01-4.875 8.306-6.59.053-.017.104-.03.156-.047a28.51 28.51 0 00-.688-1.517c-5.104 1.528-10.064 1.465-10.512 1.457a10.204 10.204 0 002.738 6.697zM2.882 11.86c.457.006 4.732.032 9.51-1.252a88.32 88.32 0 00-3.817-5.882A10.19 10.19 0 002.882 11.86zm7.517-8.532c.194.26 2.305 3.176 3.855 5.948 3.674-1.377 5.227-3.465 5.414-3.726A10.137 10.137 0 0012 1.817c-1.093 0-2.145.176-3.108.5zm7.672 2.264c-.2.27-1.924 2.48-5.733 4.026a38.25 38.25 0 01.49 1.064l.169.397c3.39-.427 6.762.257 7.112.33a10.218 10.218 0 00-2.038-5.817z"/></svg> },
]

function AvatarDisplay({ avatar }) {
  if (avatar?.type === 'file' && avatar.data) {
    return <img src={avatar.data} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', transform: avatar.transform }} />
  }
  if (avatar?.type === 'emoji' && avatar.data) {
    return <span style={{ fontSize: '4.2rem' }}>{avatar.data}</span>
  }
  return <span style={{ fontSize: '3rem' }}>👤</span>
}

export default function Setup() {
  const { avatar, profileName, profileBio, socialLinks, setSocialLinks } = useOnboarding()
  const [links, setLinks] = useState(() => socialLinks || {})
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  const handleNext = () => {
    setSocialLinks(links)
    toast('Social links saved!')
    setTimeout(() => navigate('/select'), 1200)
  }

  const avatarBg = avatar?.type === 'emoji' ? avatar.bg : ''

  return (
    <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 440, animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>
        
        {/* Avatar */}
        <div style={{ width: 130, height: 130, borderRadius: '50%', border: '2px solid #E2E2E8', background: avatarBg || '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 24 }}>
          <AvatarDisplay avatar={avatar} />
        </div>

        {/* Name */}
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: '#111111', margin: '0 0 10px 0', textAlign: 'center', letterSpacing: '-0.02em' }}>
          {profileName || 'Your Name'}
        </h1>

        {/* Bio */}
        <p style={{ color: '#111111', fontSize: '1rem', fontWeight: 500, margin: '0 0 36px 0', textAlign: 'center', maxWidth: 400 }}>
          {profileBio || 'Your bio...'}
        </p>

        {/* Platform Input List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', marginBottom: 36 }}>
          {PLATFORMS.map(p => (
            <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
              <label htmlFor={`input-${p.id}`} style={{ alignSelf: 'flex-start', fontSize: '0.85rem', fontWeight: 600, color: '#666' }}>
                {p.label} Username
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
                {/* Colored square icon wrapper */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: p.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.06)'
                }}>
                  {p.icon}
                </div>

                {/* Pill shaped input container */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F4F4F6',
                  borderRadius: 14,
                  padding: '0 18px',
                  height: 48,
                  border: '1.5px solid transparent',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ color: '#000000', fontWeight: 700, fontSize: '1.05rem', marginRight: 4 }}>@</span>
                  <input
                    type="text"
                    id={`input-${p.id}`}
                    placeholder={`${p.label} handle`}
                    value={links[p.id] || ''}
                    onChange={e => setLinks(l => ({ ...l, [p.id]: e.target.value }))}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      fontFamily: 'var(--font-body)',
                      fontSize: '1rem',
                      fontWeight: links[p.id] ? 700 : 500,
                      color: '#000000',
                      outline: 'none'
                    }}
                  />
                  {links[p.id] && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: 8 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 14, width: '100%', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/select')}
            style={{
              height: 46,
              width: 90,
              borderRadius: 10,
              background: '#ffffff',
              color: '#000000',
              border: '1.5px solid #E2E2E8',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            style={{
              height: 46,
              width: 90,
              borderRadius: 10,
              background: '#3E66FB',
              color: '#ffffff',
              border: 'none',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: 'none',
              transition: 'background 0.2s'
            }}
          >
            Next
          </button>
        </div>
      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

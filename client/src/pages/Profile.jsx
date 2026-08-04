import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'

const BIOS = [
  '🚀 Exploring the digital universe. Creating cool links and building awesome designs.',
  '✨ Full-time dreamer, part-time builder. Welcome to my personal bio corner!',
  '🍕 Pixel perfect designer & coffee enthusiast. More details coming soon!',
  '🎨 Creating beautiful user experiences and connecting people worldwide.',
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

export default function Profile() {
  const { avatar, claimedUsername, setProfileName, setProfileBio } = useOnboarding()
  const [name, setName] = useState(() => {
    if (claimedUsername && claimedUsername.toLowerCase() !== 'hi') {
      return claimedUsername.charAt(0).toUpperCase() + claimedUsername.slice(1)
    }
    return ''
  })
  const [bio, setBio] = useState('')
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  const avatarBg = avatar?.type === 'emoji' ? avatar.bg : ''

  const handleNext = () => {
    if (!name.trim()) { toast('Please enter your name!'); return }
    setProfileName(name.trim())
    setProfileBio(bio.trim())
    toast('Profile set successfully!')
    setTimeout(() => navigate('/setup'), 1200)
  }

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 50%,#F9FAFC 0%,#F3F5FA 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 520, textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Avatar */}
        <div style={{ width: 130, height: 130, borderRadius: '50%', border: '2px solid #E2E2E8', background: avatarBg || '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 24, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <AvatarDisplay avatar={avatar} />
        </div>

        {/* Name */}
        <input type="text" placeholder="Your Name" value={name} onChange={e=>setName(e.target.value)}
          style={{ width: '100%', maxWidth: 380, border: 'none', background: 'transparent', textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: '#111', outline: 'none', marginBottom: 24 }} />

        {/* Bio */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 440, marginBottom: 32 }}>
          <textarea placeholder="Your bio..." maxLength={160} value={bio} onChange={e=>setBio(e.target.value)}
            style={{ width: '100%', height: 110, borderRadius: 12, border: '1.5px solid #E2E2E8', background: '#fff', padding: '16px 42px 16px 16px', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#111', resize: 'none', outline: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }} />
          <span onClick={() => setBio(BIOS[Math.floor(Math.random()*BIOS.length)])}
            title="AI Bio Helper" style={{ position: 'absolute', right: 16, top: 16, fontSize: '1.25rem', color: '#3B82F6', cursor: 'pointer', userSelect: 'none' }}>✨</span>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 14 }}>
          <button onClick={() => navigate('/setup')} style={{ height: 46, padding: '0 28px', borderRadius: 10, background: '#fff', border: '1.5px solid #E2E2E8', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Skip</button>
          <button onClick={handleNext} style={{ height: 46, padding: '0 28px', borderRadius: 10, background: '#3B82F6', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.15)' }}>Next</button>
        </div>
      </div>
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'

function AvatarPreview({ avatar, size = 56 }) {
  const bg = avatar?.type === 'emoji' ? avatar.bg : '#E2E2EA'
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: bg, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {avatar?.type === 'file' && avatar.data
        ? <img src={avatar.data} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: avatar.transform }} />
        : <span style={{ fontSize: size * 0.55 }}>{avatar?.data || '👤'}</span>}
    </div>
  )
}

export default function Select() {
  const { avatar, profileName, profileBio, socialLinks, setSelectedTemplate } = useOnboarding()
  const [selected, setSelected] = useState('bento')
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()
  const name = profileName || 'Your Name'
  const bio  = profileBio  || 'Nice to meet you!'

  const handleContinue = () => {
    setSelectedTemplate(selected)
    toast(`Template saved: ${selected === 'bento' ? 'Bento Profile' : 'Professional Timeline'}!`)
    setTimeout(() => {
      if (selected === 'timeline') {
        navigate('/timeline')
      } else {
        navigate('/bento')
      }
    }, 1400)
  }

  const cardStyle = (id) => ({
    width: 320, background: '#FAFAFA', border: selected === id ? '2.5px solid #3B82F6' : '2.5px solid #E8E8EF',
    borderRadius: 16, overflow: 'hidden', cursor: 'pointer', position: 'relative',
    boxShadow: selected === id ? '0 6px 28px rgba(59,130,246,0.16)' : 'none',
    transition: 'all 0.22s', transform: selected === id ? 'translateY(-2px)' : 'none',
  })

  return (
    <div style={{ background: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 48px', fontFamily: 'var(--font-body)', animation: 'fadeInUp 0.5s ease-out' }}>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: '#111', margin: '0 0 10px' }}>Choose Your Page Style</h1>
        <p style={{ color: '#666', fontSize: '0.97rem', margin: 0 }}>Select a template that matches your professional identity. You can switch anytime!</p>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>

        {/* Bento Card */}
        <div style={cardStyle('bento')} onClick={() => setSelected('bento')}>
          {selected === 'bento' && (
            <div style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, background: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.78rem', fontWeight: 700, zIndex: 2 }}>✓</div>
          )}
          <div style={{ padding: '16px 14px 12px', background: '#F5F5FA', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <AvatarPreview avatar={avatar} size={90} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: '#111', textAlign: 'center' }}>{name}</div>
            <div style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center' }}>{bio}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[{bg:'#FF0000',label:socialLinks?.youtube||'channel'},{bg:'#0A66C2',label:socialLinks?.linkedin||'profile'}].map(({bg,label})=>(
                <div key={label} style={{ width: 68, height: 68, borderRadius: 10, background: '#fff', border: '1px solid #E8E8EF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontSize: '0.7rem', color: '#555' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: bg }} />
                  <span>{label.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '14px 18px', fontSize: '1rem', fontWeight: 700, color: '#111' }}>Bento Profile</div>
        </div>

        {/* Timeline Card */}
        <div style={cardStyle('timeline')} onClick={() => setSelected('timeline')}>
          {selected === 'timeline' && (
            <div style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, background: '#3B82F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.78rem', fontWeight: 700, zIndex: 2 }}>✓</div>
          )}
          <div style={{ padding: '16px 14px 12px', background: '#F5F5FA', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 8, padding: '6px 8px' }}>
              <AvatarPreview avatar={avatar} size={44} />
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111' }}>{name}</div>
                <div style={{ fontSize: '0.75rem', color: '#888' }}>{bio}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['YT','#FF0000'],['in','#0A66C2']].map(([t,c])=><div key={t} style={{ height: 20, padding: '0 10px', borderRadius: 6, background: c, color: '#fff', fontSize: '0.65rem', fontWeight: 600, display: 'flex', alignItems: 'center' }}>{t}</div>)}
            </div>
            {[1,.7,.45,.25].map((o,i)=><div key={i} style={{ height: 40, background: '#F0F0F8', borderRadius: 7, opacity: o }} />)}
          </div>
          <div style={{ padding: '14px 18px', fontSize: '1rem', fontWeight: 700, color: '#111' }}>Professional Timeline</div>
        </div>
      </div>

      <button onClick={handleContinue}
        style={{ height: 50, padding: '0 40px', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'var(--font-body)', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 18px rgba(59,130,246,0.22)', marginBottom: 10 }}>
        Continue with this template
      </button>
      <p style={{ color: '#AAAAAA', fontSize: '0.78rem', margin: 0 }}>Your content stays the same when you switch templates</p>

      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

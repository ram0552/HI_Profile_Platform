import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'
import { getSocialIcon, getSocialBrandColor } from '../components/SocialIcons'

function AvatarDisplay({ avatar }) {
  if (avatar?.type === 'file' && avatar.data) {
    return <img src={avatar.data} alt="avatar" style={{ transform: avatar.transform, width: '100%', height: '100%', objectFit: 'cover' }} />
  }
  if (avatar?.type === 'emoji' && avatar.data) {
    return <span style={{ fontSize: '4rem', lineHeight: '90px' }}>{avatar.data}</span>
  }
  return <span style={{ fontSize: '3rem', color: '#888' }}>👤</span>
}

export default function TimelineLive() {
  const { theme, setTheme, avatar, profileName, profileBio, location, socialLinks, workHistory, projects, expertise, profileCardFont, accentColor } = useOnboarding()
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()
  
  const [isDark, setIsDark] = useState(theme === 'dark')
  
  useEffect(() => {
    setIsDark(theme === 'dark')
  }, [theme])

  const name = profileName || 'Sarah Chen'
  const bio = profileBio || 'Designing the future of collaborative tools.'
  const userLocation = location || 'San Francisco, CA'

  const handleCopyLink = () => {
    const url = `hiprofile.bio/${profileName?.toLowerCase().replace(/\s+/g, '') || 'profile'}`
    navigator.clipboard.writeText(url)
    toast('Profile link copied to clipboard!')
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    setIsDark(nextTheme === 'dark')
    toast(`Switched to ${nextTheme} theme!`)
  }

  const wrapperClass = isDark ? 'dark-mode-active' : ''

  // Custom inline styles for timeline live view matching design guidelines
  const containerStyle = {
    fontFamily: profileCardFont || 'var(--font-body)',
    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
    color: isDark ? '#F8FAFC' : '#0F172A',
    minHeight: '100vh',
    paddingBottom: '100px',
    transition: 'all 0.3s ease-in-out'
  }

  return (
    <div className={wrapperClass} style={containerStyle}>
      
      {/* Navbar Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 40px',
        borderBottom: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div onClick={handleCopyLink} style={{ cursor: 'pointer', fontWeight: 600, color: isDark ? '#94A3B8' : '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>🔗</span> hiprofile.com/{profileName?.toLowerCase().replace(/\s+/g, '') || 'user'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button 
            id="btn-timeline-dashboard-go"
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: accentColor || '#3B82F6',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 20,
              padding: '8px 20px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.88rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1000px', margin: '40px auto 0 auto', padding: '0 24px' }}>
        
        {/* Profile Card Header */}
        <section style={{
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: `1.5px solid ${isDark ? '#334155' : '#EBEBEF'}`,
          borderRadius: 28,
          padding: '40px',
          display: 'flex',
          gap: 32,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '40px',
          boxShadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.01)'
        }}>
          {/* Avatar Circle */}
          <div style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            backgroundColor: avatar?.type === 'emoji' ? avatar.bg : (isDark ? '#334155' : '#F3F4F6'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: `3px solid ${isDark ? '#475569' : '#FFFFFF'}`,
            boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
            flexShrink: 0
          }}>
            <AvatarDisplay avatar={avatar} />
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{name}</h1>
              <span style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', color: accentColor || '#3B82F6', fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 100 }}>PRO</span>
            </div>
            <p style={{ fontSize: '1.05rem', color: isDark ? '#94A3B8' : '#475569', margin: '0 0 6px 0', fontWeight: 600 }}>Product Designer &amp; Builder</p>
            <p style={{ fontSize: '0.9rem', color: isDark ? '#64748B' : '#888896', margin: '0 0 16px 0', fontWeight: 500 }}>📍 {userLocation}</p>
            <p style={{ fontSize: '1rem', color: isDark ? '#CBD5E1' : '#334155', margin: '0 0 20px 0', lineHeight: 1.5 }}>{bio}</p>
            
            {/* Social Icons row */}
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.keys(socialLinks || {}).map(key => {
                const usernameVal = socialLinks[key];
                if (!usernameVal) return null;
                
                let link = '#';
                if (key === 'twitter') link = `https://twitter.com/${usernameVal}`;
                else if (key === 'instagram') link = `https://instagram.com/${usernameVal}`;
                else if (key === 'linkedin') link = `https://linkedin.com/in/${usernameVal}`;
                else if (key === 'github') link = `https://github.com/${usernameVal}`;
                else if (key === 'youtube') link = `https://youtube.com/@${usernameVal}`;
                
                const brandColor = getSocialBrandColor(key);
                return (
                  <a key={key} href={link} target="_blank" rel="noopener noreferrer" 
                     style={{ 
                       width: 36, 
                       height: 36, 
                       background: isDark ? '#334155' : '#F3F4F6', 
                       borderRadius: '50%', 
                       display: 'flex', 
                       alignItems: 'center', 
                       justifyContent: 'center', 
                       textDecoration: 'none', 
                       transition: 'all 0.2s', 
                       border: `1px solid ${isDark ? '#475569' : '#E2E8F0'}`,
                       color: isDark ? '#94A3B8' : '#4B5563'
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.color = '#FFFFFF';
                       e.currentTarget.style.background = brandColor;
                       e.currentTarget.style.borderColor = brandColor;
                       e.currentTarget.style.transform = 'translateY(-2px)';
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.color = isDark ? '#94A3B8' : '#4B5563';
                       e.currentTarget.style.background = isDark ? '#334155' : '#F3F4F6';
                       e.currentTarget.style.borderColor = isDark ? '#475569' : '#E2E8F0';
                       e.currentTarget.style.transform = 'translateY(0)';
                     }}
                     title={`${key}: @${usernameVal}`}>
                    {getSocialIcon(key, 18, 'currentColor')}
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dynamic Split Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '40px' }} className="timeline-live-grid">
          
          {/* Left Panel: Vertical Professional Timeline */}
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: accentColor || '#3B82F6' }}>💼</span> Experience Timeline
            </h2>

            <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: `2.5px solid ${isDark ? '#334155' : '#E2E8F0'}` }}>
              {(workHistory || []).map((work, idx) => (
                <div key={idx} style={{ position: 'relative', marginBottom: '32px' }}>
                  {/* Circle dot on line */}
                  <div style={{
                    position: 'absolute',
                    left: '-34px',
                    top: '4px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                    border: `3px solid ${accentColor || '#3B82F6'}`,
                    boxShadow: '0 0 0 4px rgba(59,130,246,0.1)'
                  }} />

                  <div style={{
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1.5px solid ${isDark ? '#334155' : '#EBEBEF'}`,
                    borderRadius: 16,
                    padding: 20,
                    boxShadow: isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.005)'
                  }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: accentColor || '#3B82F6', marginBottom: 4 }}>
                      {work.period}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px 0' }}>{work.role}</h3>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: isDark ? '#94A3B8' : '#64748B', margin: '0 0 10px 0' }}>
                      {work.company}
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: isDark ? '#CBD5E1' : '#475569', margin: 0, lineHeight: 1.5 }}>
                      {work.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Projects & Expertise */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Skills */}
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: accentColor || '#3B82F6' }}>✦</span> Expertise
              </h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(expertise || []).map(skill => (
                  <span key={skill} style={{
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
                    color: isDark ? '#CBD5E1' : '#475569',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: 100,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Projects */}
            <div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: accentColor || '#3B82F6' }}>🎨</span> Featured Work
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(projects || []).map((proj, idx) => (
                  <div key={idx} style={{
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    border: `1.5px solid ${isDark ? '#334155' : '#EBEBEF'}`,
                    borderRadius: 18,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.01)'
                  }}>
                    {proj.image && (
                      <div style={{ height: 130, overflow: 'hidden', backgroundColor: '#F1F5F9' }}>
                        <img src={proj.image} alt={proj.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <div style={{ padding: 18 }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0' }}>{proj.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: isDark ? '#94A3B8' : '#64748B', margin: '0 0 12px 0', lineHeight: 1.4 }}>{proj.desc}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {(proj.tags || []).map(t => (
                          <span key={t} style={{ fontSize: '0.72rem', fontWeight: 700, backgroundColor: isDark ? '#334155' : '#F1F5F9', color: isDark ? '#94A3B8' : '#64748B', padding: '2px 8px', borderRadius: 4 }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Floating Theme Button */}
      <button 
        onClick={toggleTheme}
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          border: `1.5px solid ${isDark ? '#334155' : '#E2E8F0'}`,
          color: isDark ? '#F8FAFC' : '#0F172A',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          fontSize: '1.3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
        title="Toggle Theme"
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

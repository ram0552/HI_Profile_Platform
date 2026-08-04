import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import Toast, { useToast } from '../components/Toast'
import { getSocialIcon, getSocialBrandColor } from '../components/SocialIcons'

export default function TimelineView() {
  const {
    avatar, setAvatar,
    profileName, setProfileName,
    profileBio, setProfileBio,
    socialLinks, setSocialLinks,
    selectedTemplate, setSelectedTemplate,
    location, setLocation,
    expertise,
    claimedUsername, setClaimedUsername,
    accentColor, setAccentColor,
    fontSize, setFontSize,
    profileCardFont, setProfileCardFont,
  } = useOnboarding()

  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [toastMsg, toastShow, toast] = useToast()

  // Main Tab State
  const [activeTab, setActiveTab] = useState('my-profile') // 'my-profile' | 'edit-profile' | 'share-profile' | 'settings'
  
  // Settings Sub-Tab State
  const [activeSettingsTab, setActiveSettingsTab] = useState('account') // 'account' | 'notifications' | 'privacy' | 'billing' | 'domain' | 'appearance' | 'danger'

  // Local temp states for Appearance
  const [tempAccentColor, setTempAccentColor] = useState(accentColor)
  const [tempFontSize, setTempFontSize] = useState(fontSize)
  const [tempProfileCardFont, setTempProfileCardFont] = useState(profileCardFont)

  const ACCENT_COLORS = [
    { name: 'Indigo', value: '#4F46E5' },
    { name: 'Purple', value: '#7C3AED' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Green', value: '#10B981' },
    { name: 'Blue', value: '#0EA5E9' }
  ]

  const isDark = false
  const textColor = '#111111'
  const subTextColor = '#6B7280'
  const borderColor = '#F3F4F6'

  const fontSizeCardStyle = (isActive) => ({
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: isActive ? `2px solid ${tempAccentColor}` : `1.5px solid #EBEBEF`,
    background: isActive ? '#FFFFFF' : '#F9FAFB',
    color: isActive ? tempAccentColor : '#6B7280',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s ease'
  })

  const fontPillStyle = (isActive) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    background: isActive ? tempAccentColor : '#F3F4F6',
    color: isActive ? '#FFFFFF' : '#4B5563',
    fontWeight: 600,
    fontSize: '0.82rem',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  })

  const handleSaveAppearance = () => {
    setAccentColor(tempAccentColor)
    setFontSize(tempFontSize)
    setProfileCardFont(tempProfileCardFont)
    toast('Appearance saved successfully!')
  }

  const handleResetAppearance = () => {
    setTempAccentColor('#4F46E5')
    setTempFontSize('medium')
    setTempProfileCardFont('Inter')
    setAccentColor('#4F46E5')
    setFontSize('medium')
    setProfileCardFont('Inter')
    toast('Appearance reset to default')
  }

  // Local form states (initialized from context)
  const [formName, setFormName] = useState(profileName || 'Foxy Man')
  const [formBio, setFormBio] = useState(profileBio || 'Nice to meet you, I\'m a designer!')
  const [formLocation, setFormLocation] = useState(location || 'Salur, Andhra Pradesh, India')
  const [formUsername, setFormUsername] = useState(claimedUsername || 'foxyman')
  const [formSocials, setFormSocials] = useState({
    twitter: socialLinks?.twitter || 'foxyman',
    instagram: socialLinks?.instagram || 'foxyman',
    linkedin: socialLinks?.linkedin || 'foxyman',
    youtube: socialLinks?.youtube || '',
    github: socialLinks?.github || '',
    google: socialLinks?.google || '',
    discord: socialLinks?.discord || ''
  })
  
  // Toggle switches states for edit profile social links
  const [socialToggles, setSocialToggles] = useState({
    twitter: true,
    instagram: true,
    linkedin: true,
    google: false,
    discord: false
  })

  // Settings: Notifications Toggles
  const [settingEmail, setSettingEmail] = useState(true)
  const [settingAlerts, setSettingAlerts] = useState(true)
  const [settingClicks, setSettingClicks] = useState(false)
  const [settingReport, setSettingReport] = useState(true)
  const [settingUpdates, setSettingUpdates] = useState(false)

  // Settings: Privacy & Security Toggles
  const [privacyPublic, setPrivacyPublic] = useState(true)
  const [privacySearch, setPrivacySearch] = useState(true)
  const [privacyAnalytics, setPrivacyAnalytics] = useState(false)
  const [privacy2fa, setPrivacy2fa] = useState(false)

  // Settings: Domain
  const [customDomain, setCustomDomain] = useState('')

  // Account Settings form states
  const [accountEmail, setAccountEmail] = useState('foxyman@gmail.com')
  const [accountPhone, setAccountPhone] = useState('')

  // Copy helper
  const handleCopyToClipboard = (text, message = 'Copied to clipboard!') => {
    navigator.clipboard.writeText(text)
    toast(message)
  }

  // Copy Profile Link
  const handleCopyLink = () => {
    const url = `hiprofile.bio/${formUsername}`
    handleCopyToClipboard(url, 'URL copied to clipboard!')
  }

  // Handle uploader changes
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setAvatar({ type: 'file', data: ev.target.result, transform: '', bg: '' })
      toast('Photo updated successfully!')
    }
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setAvatar({ type: null, data: null, transform: '', bg: '' })
    toast('Avatar removed')
  }

  // Save changes
  const handleSaveChanges = () => {
    setProfileName(formName)
    setProfileBio(formBio)
    setLocation(formLocation)
    setClaimedUsername(formUsername.toLowerCase().replace(/[^a-z0-9_]/g, ''))
    
    // Save only enabled socials
    const savedSocials = {}
    Object.keys(formSocials).forEach(key => {
      if (formSocials[key] && (socialToggles[key] !== false)) {
        savedSocials[key] = formSocials[key]
      }
    })
    setSocialLinks(savedSocials)
    
    toast('Profile updated successfully!')
    setTimeout(() => setActiveTab('my-profile'), 1200)
  }

  // Template switch
  const handleTemplateSwitch = (styleId) => {
    setSelectedTemplate(styleId)
    toast(`Template switched to: ${styleId === 'bento' ? 'Bento Style' : 'Professional Timeline'}`)
  }

  // Render social platforms nicely
  const getSocialLogo = (platformId) => {
    const brandColor = getSocialBrandColor(platformId);
    return (
      <div className="db-social-input-logo" style={{ background: brandColor, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {getSocialIcon(platformId, 16, '#fff')}
      </div>
    )
  }

  // Render view live page
  const handleViewLivePage = () => {
    if (selectedTemplate === 'bento') {
      navigate('/bento')
    } else {
      navigate('/timeline-live')
    }
  }

  return (
    <div className="db-wrapper">
      <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />

      {/* 1. Left Sidebar Navigation */}
      <aside className="db-sidebar">
        <div className="db-sidebar-top">
          {/* Logo row */}
          <div className="db-logo-row">
            <span style={{ fontSize: '1.8rem' }}>👤</span>
            <span>Profile</span>
          </div>

          {/* User identity mini card */}
          <a href="#" className="db-user-mini-card" onClick={(e) => { e.preventDefault(); handleViewLivePage(); }}>
            <div className="db-user-mini-avatar">
              {avatar?.data ? (
                <img src={avatar.data} alt="avatar" className="db-user-mini-avatar-img" />
              ) : (
                <span>👤</span>
              )}
            </div>
            <div className="db-user-mini-info">
              <span className="db-user-mini-name">{formName}</span>
              <span className="db-user-mini-url">hiprofile.bio/{formUsername}</span>
            </div>
          </a>

          {/* Sidebar Menu Items */}
          <ul className="db-menu-list">
            <li>
              <button
                className={`db-menu-item ${activeTab === 'my-profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-profile')}
              >
                <span style={{ fontSize: '1.25rem' }}>👤</span> My Profile
              </button>
            </li>
            <li>
              <button
                className={`db-menu-item ${activeTab === 'edit-profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit-profile')}
              >
                <span style={{ fontSize: '1.25rem' }}>✏️</span> Edit Profile
              </button>
            </li>
            <li>
              <button
                className={`db-menu-item ${activeTab === 'share-profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('share-profile')}
              >
                <span style={{ fontSize: '1.25rem' }}>🔗</span> Share Profile
              </button>
            </li>
            <li>
              <button
                className={`db-menu-item ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => { setActiveTab('settings'); setActiveSettingsTab('account'); }}
              >
                <span style={{ fontSize: '1.25rem' }}>⚙️</span> Settings
              </button>
            </li>
          </ul>
        </div>

        {/* Bottom logout row */}
        <div className="db-sidebar-bottom">
          <button className="db-logout-btn" onClick={() => navigate('/')}>
            <div className="db-logout-user-row">
              <div className="db-logout-avatar">
                {avatar?.data ? <img src={avatar.data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
              </div>
              <span className="db-logout-name">{formName}</span>
            </div>
            <span className="db-logout-icon">&rarr;</span>
          </button>
        </div>
      </aside>

      {/* 2. Main content workspace */}
      <main className="db-main-workspace">
        
        {/* ==================== TAB: MY PROFILE ==================== */}
        {activeTab === 'my-profile' && (
          <div>
            <header className="db-header">
              <div className="db-header-left">
                <h2 className="db-header-title">My Profile</h2>
                <p className="db-header-subtitle">This is how your profile looks to visitors</p>
              </div>
              <div className="db-header-actions">
                <button className="db-btn db-btn-secondary" onClick={() => setActiveTab('edit-profile')}>
                  Edit Profile
                </button>
                <button className="db-btn db-btn-primary" onClick={handleViewLivePage}>
                  View Live Page &rarr;
                </button>
              </div>
            </header>

            <div className="db-profile-grid">
              
              {/* Left sidebar preview details */}
              <div className="db-profile-sidebar">
                
                {/* 1. Preview Card */}
                <div className="db-card-container db-preview-card-card">
                  <div className="db-preview-avatar" style={{ background: avatar?.type === 'emoji' ? avatar.bg : '#F3F4F6' }}>
                    {avatar?.data ? (
                      <img src={avatar.data} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '2.5rem' }}>👤</span>
                    )}
                  </div>
                  <div className="db-preview-name-row">
                    <h3 className="db-preview-name">{formName}</h3>
                    <span className="pro-badge-coral" style={{ padding: '2px 6px', fontSize: '0.62rem' }}>PRO</span>
                  </div>
                  <div className="db-preview-role">Graphic Designer &amp; Illustrator</div>
                  <div className="db-preview-location">📍 {formLocation}</div>
                  <p className="db-preview-bio">"{formBio}"</p>

                  <div className="db-preview-socials">
                    {Object.keys(formSocials).map(key => {
                      if (!formSocials[key] || socialToggles[key] === false) return null
                      const brandColor = getSocialBrandColor(key);
                      return (
                        <a key={key} href="#" className="db-preview-social-circle" title={key}
                           style={{
                             width: 32,
                             height: 32,
                             borderRadius: '50%',
                             background: '#F3F4F6',
                             display: 'inline-flex',
                             alignItems: 'center',
                             justifyContent: 'center',
                             color: '#4B5563',
                             margin: '0 4px',
                             transition: 'all 0.2s'
                           }}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.color = '#FFFFFF';
                             e.currentTarget.style.background = brandColor;
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.color = '#4B5563';
                             e.currentTarget.style.background = '#F3F4F6';
                           }}>
                          {getSocialIcon(key, 16, 'currentColor')}
                        </a>
                      )
                    })}
                  </div>

                  {/* Clipboard Box */}
                  <div className="db-clipboard-row" onClick={handleCopyLink}>
                    <span className="db-clipboard-text">hiprofile.bio/{formUsername}</span>
                    <span style={{ fontSize: '0.9rem', color: '#9CA3AF' }}>📋</span>
                  </div>
                </div>

                {/* 2. Expertise Card */}
                <div className="db-card-container">
                  <h4 className="sidebar-section-title">Expertise</h4>
                  <div className="expertise-chips-container">
                    {(expertise || ['UI/UX', 'Product Design', 'Design Systems', 'Figma', 'Prototyping', 'Illustrator', 'Motion Design']).map(skill => (
                      <span key={skill} className="expertise-chip">{skill}</span>
                    ))}
                  </div>
                </div>

                {/* 3. Social Links card list */}
                <div className="db-card-container" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <h4 className="sidebar-section-title">Social Links</h4>
                  {Object.keys(formSocials).map(key => {
                    if (!formSocials[key] || socialToggles[key] === false) return null
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {getSocialLogo(key)}
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>@{formSocials[key]} ↗</span>
                      </div>
                    )
                  })}
                </div>

              </div>

              {/* Right content styling panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* 1. Active Page Style Card */}
                <div className="db-card-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Active Page Style</h3>
                    <span style={{ fontSize: '0.88rem', color: '#3B82F6', fontWeight: 700, cursor: 'pointer' }}>Change Style</span>
                  </div>
                  
                  {/* Cards side by side */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                    
                    {/* Bento Option */}
                    <div
                      className={`db-style-card ${selectedTemplate === 'bento' ? 'active' : ''}`}
                      onClick={() => handleTemplateSwitch('bento')}
                    >
                      <div className="db-style-card-left">
                        <div className="db-style-icon-box">📊</div>
                        <div>
                          <div className="db-style-label">Bento Style</div>
                          {selectedTemplate === 'bento' && (
                            <span style={{ background: '#D2F7E2', color: '#00BA9D', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 100 }}>Active</span>
                          )}
                        </div>
                      </div>
                      {selectedTemplate !== 'bento' && (
                        <span style={{ fontSize: '0.82rem', color: '#3B82F6', fontWeight: 700 }}>Switch &rarr;</span>
                      )}
                    </div>

                    {/* Timeline Option */}
                    <div
                      className={`db-style-card ${selectedTemplate === 'timeline' ? 'active' : ''}`}
                      onClick={() => handleTemplateSwitch('timeline')}
                    >
                      <div className="db-style-card-left">
                        <div className="db-style-icon-box">📋</div>
                        <div>
                          <div className="db-style-label">Professional</div>
                          {selectedTemplate === 'timeline' && (
                            <span style={{ background: '#D2F7E2', color: '#00BA9D', fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: 100 }}>Active</span>
                          )}
                        </div>
                      </div>
                      {selectedTemplate !== 'timeline' && (
                        <span style={{ fontSize: '0.82rem', color: '#3B82F6', fontWeight: 700 }}>Switch &rarr;</span>
                      )}
                    </div>

                  </div>
                </div>

                {/* 2. Profile Preview visual card */}
                <div className="db-card-container" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Profile Preview</h3>
                    <span onClick={handleViewLivePage} style={{ fontSize: '0.88rem', color: '#3B82F6', fontWeight: 700, cursor: 'pointer' }}>
                      View Full Page &rarr;
                    </span>
                  </div>
                  
                  {/* Miniature screen mock */}
                  <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 16, height: 260, position: 'relative', overflow: 'hidden', padding: 20, fontFamily: profileCardFont || 'var(--font-body)' }}>
                    {selectedTemplate === 'bento' ? (
                      // Bento design thumbnail mockup
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ background: '#FFE5D9', borderRadius: 10, height: 80, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>Hello! I am Graphic Designer &amp; Illustrator</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: -25 }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F3F4F6', border: '2px solid #fff' }} />
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.8rem', fontWeight: 800 }}>Foxy Man</div>
                        <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#6B7280', marginTop: -6 }}>Nice to meet you...</div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                          {[1,2,3,4,5].map(o=><span key={o} style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6' }} />)}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
                          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, height: 36 }} />
                          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, height: 36 }} />
                          <div style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 6, height: 36 }} />
                        </div>
                      </div>
                    ) : (
                      // Timeline layout thumbnail mockup
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E5E7EB' }} />
                          <div style={{ height: 10, background: '#DDD', borderRadius: 3, width: '80%' }} />
                          <div style={{ height: 6, background: '#EEE', borderRadius: 3, width: '100%' }} />
                          <div style={{ height: 26, background: '#FFF', border: '1px solid #EEE', borderRadius: 5 }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ height: 16, width: 44, background: '#3B82F6', borderRadius: 4 }} />
                            <div style={{ height: 16, width: 44, background: '#E5E7EB', borderRadius: 4 }} />
                          </div>
                          {[1,2,3].map(i=><div key={i} style={{ height: 42, background: '#FFF', border: '1px solid #EEE', borderRadius: 6 }} />)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB: EDIT PROFILE ==================== */}
        {activeTab === 'edit-profile' && (
          <div>
            <header className="db-header">
              <div className="db-header-left">
                <h2 className="db-header-title">Edit Profile</h2>
              </div>
              <div className="db-header-actions">
                <button className="db-btn db-btn-primary" onClick={handleSaveChanges}>
                  Save Changes
                </button>
              </div>
            </header>

            <div className="db-edit-grid">
              
              {/* Left sidebar - avatar change, style selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Avatar change */}
                <div className="db-card-container db-avatar-uploader-card">
                  <div className="db-uploader-circle">
                    {avatar?.data ? (
                      <img src={avatar.data} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '3rem' }}>👤</span>
                    )}
                  </div>
                  <div className="db-uploader-buttons">
                    <button className="db-btn-action db-btn-change" onClick={() => fileRef.current?.click()}>
                      Change Photo
                    </button>
                    <button className="db-btn-action db-btn-remove" onClick={handleRemovePhoto}>
                      Remove
                    </button>
                  </div>
                </div>

                {/* Page Style */}
                <div className="db-card-container">
                  <h4 className="sidebar-section-title" style={{ marginBottom: 16 }}>Page Style</h4>
                  
                  {/* Bento style card radio */}
                  <div
                    className={`db-style-card ${selectedTemplate === 'bento' ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate('bento')}
                    style={{ padding: 12, borderRadius: 12 }}
                  >
                    <div className="db-style-card-left" style={{ gap: 10 }}>
                      <div className="db-style-icon-box" style={{ width: 36, height: 28 }}>📊</div>
                      <span className="db-style-label" style={{ fontSize: '0.88rem' }}>Bento Style</span>
                    </div>
                    <div className="db-radio-circle">
                      {selectedTemplate === 'bento' && <div className="db-radio-dot" />}
                    </div>
                  </div>

                  {/* Professional style card radio */}
                  <div
                    className={`db-style-card ${selectedTemplate === 'timeline' ? 'active' : ''}`}
                    onClick={() => setSelectedTemplate('timeline')}
                    style={{ padding: 12, borderRadius: 12 }}
                  >
                    <div className="db-style-card-left" style={{ gap: 10 }}>
                      <div className="db-style-icon-box" style={{ width: 36, height: 28 }}>📋</div>
                      <span className="db-style-label" style={{ fontSize: '0.88rem' }}>Professional</span>
                    </div>
                    <div className="db-radio-circle">
                      {selectedTemplate === 'timeline' && <div className="db-radio-dot" />}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right column - inputs form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* 1. Basic Info */}
                <div className="db-card-container db-form-section">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12 }}>Basic Info</h3>
                  
                  <div className="db-form-group-row">
                    <div>
                      <label className="db-form-label">Name</label>
                      <input type="text" className="db-form-input" value={formName} onChange={e => setFormName(e.target.value)} />
                    </div>
                    <div>
                      <label className="db-form-label">Username</label>
                      <input type="text" className="db-form-input" value={formUsername} onChange={e => setFormUsername(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="db-form-label">Bio</label>
                    <textarea
                      className="db-form-input"
                      rows="3"
                      value={formBio}
                      onChange={e => setFormBio(e.target.value)}
                      style={{ resize: 'none', height: 'auto' }}
                    />
                  </div>

                  <div>
                    <label className="db-form-label">Location</label>
                    <input type="text" className="db-form-input" value={formLocation} onChange={e => setFormLocation(e.target.value)} />
                  </div>
                </div>

                {/* 2. Social Links */}
                <div className="db-card-container">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12, marginBottom: 10 }}>Social Links</h3>
                  
                  {/* List of social link sliders */}
                  {['twitter', 'instagram', 'linkedin', 'google', 'discord'].map(key => (
                    <div key={key} className="db-social-input-row">
                      <div className="db-social-input-left">
                        {getSocialLogo(key)}
                        <span className="db-social-platform-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        <span style={{ color: '#9CA3AF', marginRight: 4 }}>@</span>
                        <input
                          type="text"
                          className="db-social-text-input"
                          placeholder="handle"
                          value={formSocials[key] || ''}
                          onChange={e => setFormSocials({ ...formSocials, [key]: e.target.value })}
                        />
                      </div>
                      
                      {/* Switch Toggle */}
                      <label className="db-toggle-switch-wrapper">
                        <input
                          type="checkbox"
                          checked={socialToggles[key] !== false}
                          onChange={e => setSocialToggles({ ...socialToggles, [key]: e.target.checked })}
                        />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB: SHARE PROFILE ==================== */}
        {activeTab === 'share-profile' && (
          <div>
            <header className="db-header">
              <div className="db-header-left">
                <h2 className="db-header-title">Share Your Profile</h2>
              </div>
            </header>

            <div className="db-share-grid">
              
              {/* Left Share cards column */}
              <div className="db-share-card-container">
                
                {/* 1. Profile mini visit box */}
                <div className="db-share-subcard">
                  <div className="db-share-subcard-left">
                    <div className="db-share-avatar">
                      {avatar?.data ? (
                        <img src={avatar.data} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>👤</span>
                      )}
                    </div>
                    <div className="db-share-details">
                      <span className="db-share-name">{formName}</span>
                      <span className="db-share-url-text">hiprofile.bio/{formUsername}</span>
                    </div>
                  </div>
                  <button className="db-btn db-btn-primary" onClick={handleViewLivePage} style={{ padding: '8px 16px', borderRadius: 8 }}>
                    Visit Page &rarr;
                  </button>
                </div>

                {/* 2. URL Copy box */}
                <div className="db-card-container">
                  <h4 className="db-form-label">Your Profile URL</h4>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <input type="text" readOnly className="db-form-input" value={`hiprofile.bio/${formUsername}`} />
                    <button className="db-btn db-btn-primary" onClick={handleCopyLink} style={{ flexShrink: 0 }}>
                      Copy Link
                    </button>
                  </div>
                </div>

                {/* 3. Share options */}
                <div className="db-card-container">
                  <h4 className="db-form-label">Share via</h4>
                  <div className="db-share-social-grid">
                    {[
                      { name: 'WhatsApp', bg: '#25D366', icon: '💬' },
                      { name: 'Twitter', bg: '#1DA1F2', icon: '🕊️' },
                      { name: 'LinkedIn', bg: '#0077B5', icon: '💼' },
                      { name: 'Instagram', bg: '#E1306C', icon: '📸' },
                      { name: 'More', bg: '#9CA3AF', icon: '•••' }
                    ].map(s => (
                      <button key={s.name} className="db-share-social-btn" onClick={() => toast(`Shared to ${s.name}`)}>
                        <div className="db-share-social-icon-circle" style={{ background: s.bg }}>
                          {s.icon}
                        </div>
                        <span className="db-share-social-label">{s.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  <button
                    className="db-btn db-btn-secondary"
                    onClick={() => toast('QR Code downloaded')}
                    style={{ width: '100%', marginTop: 24, padding: 12, borderRadius: 12 }}
                  >
                    📥 Download QR Code
                  </button>
                </div>

              </div>

              {/* Right QR card column */}
              <div className="db-card-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
                {/* Simulated QR Code */}
                <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 20, border: '1.5px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', display: 'inline-block', marginBottom: 16 }}>
                  {/* Clean SVG representation of a QR code */}
                  <svg viewBox="0 0 100 100" width="180" height="180" style={{ shapeRendering: 'crispEdges' }}>
                    {/* Corners */}
                    <rect x="0" y="0" width="30" height="30" fill="#111" />
                    <rect x="3" y="3" width="24" height="24" fill="#FFF" />
                    <rect x="9" y="9" width="12" height="12" fill="#111" />

                    <rect x="70" y="0" width="30" height="30" fill="#111" />
                    <rect x="73" y="3" width="24" height="24" fill="#FFF" />
                    <rect x="79" y="9" width="12" height="12" fill="#111" />

                    <rect x="0" y="70" width="30" height="30" fill="#111" />
                    <rect x="3" y="73" width="24" height="24" fill="#FFF" />
                    <rect x="9" y="79" width="12" height="12" fill="#111" />

                    {/* Middle elements */}
                    <rect x="42" y="42" width="16" height="16" fill="#3B82F6" />
                    <rect x="45" y="45" width="10" height="10" fill="#FFF" />
                    <text x="50" y="52" fontSize="5" fontWeight="900" fill="#3B82F6" textAnchor="middle">HP</text>

                    {/* Random noise matrix */}
                    <rect x="35" y="5" width="5" height="10" fill="#111" /><rect x="45" y="0" width="10" height="5" fill="#111" />
                    <rect x="60" y="15" width="5" height="5" fill="#111" /><rect x="35" y="25" width="15" height="5" fill="#111" />
                    <rect x="5" y="35" width="10" height="5" fill="#111" /><rect x="20" y="45" width="5" height="10" fill="#111" />
                    <rect x="90" y="35" width="5" height="15" fill="#111" /><rect x="75" y="45" width="10" height="5" fill="#111" />
                    <rect x="35" y="60" width="5" height="10" fill="#111" /><rect x="45" y="75" width="5" height="10" fill="#111" />
                    <rect x="60" y="65" width="10" height="5" fill="#111" /><rect x="65" y="80" width="10" height="10" fill="#111" />
                    <rect x="85" y="75" width="10" height="5" fill="#111" /><rect x="85" y="75" width="10" height="5" fill="#111" /><rect x="90" y="90" width="10" height="5" fill="#111" />
                  </svg>
                </div>
                <span style={{ fontSize: '0.9rem', color: '#6B7280', fontWeight: 600 }}>Scan to visit profile</span>
                <span style={{ fontSize: '0.85rem', color: '#3B82F6', fontWeight: 700, marginTop: 4 }}>hiprofile.bio/{formUsername}</span>
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB: SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <div>
            <header className="db-header">
              <div className="db-header-left">
                <h2 className="db-header-title">Settings</h2>
                <p className="db-header-subtitle">Manage your account and preferences</p>
              </div>
            </header>

            <div className="db-settings-wrapper">
              
              {/* Settings navigation sidebar */}
              <div className="db-card-container db-settings-sub-menu" style={{ padding: 16 }}>
                <button
                  className={`db-settings-sub-btn ${activeSettingsTab === 'account' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('account')}
                >
                  👤 Account
                </button>
                <button
                  className={`db-settings-sub-btn ${activeSettingsTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('notifications')}
                >
                  🔔 Notifications
                </button>
                <button
                  className={`db-settings-sub-btn ${activeSettingsTab === 'privacy' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('privacy')}
                >
                  🔒 Privacy &amp; Security
                </button>
                <button
                  className={`db-settings-sub-btn ${activeSettingsTab === 'billing' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('billing')}
                >
                  💳 Billing &amp; Plan
                </button>
                <button
                  className={`db-settings-sub-btn ${activeSettingsTab === 'domain' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('domain')}
                >
                  🌐 Domain
                </button>
                <button
                  className={`db-settings-sub-btn ${activeSettingsTab === 'appearance' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('appearance')}
                >
                  🎨 Appearance
                </button>
                <button
                  className={`db-settings-sub-btn ${activeSettingsTab === 'danger' ? 'active' : ''}`}
                  onClick={() => setActiveSettingsTab('danger')}
                  style={{ color: '#FF3366', ...(activeSettingsTab === 'danger' ? { background: '#FEE2E2', color: '#EF4444' } : {}) }}
                >
                  🚨 Danger Zone
                </button>
              </div>

              {/* Settings Content Detail Panel */}
              <div className="db-card-container">
                
                {/* 1. Account Settings */}
                {activeSettingsTab === 'account' && (
                  <div className="db-form-section">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12 }}>
                      Account Information
                    </h3>
                    
                    {/* User display row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div className="db-user-mini-avatar" style={{ width: 56, height: 56, fontSize: '1.8rem' }}>
                        {avatar?.data ? <img src={avatar.data} className="db-user-mini-avatar-img" /> : '👤'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111' }}>{formName}</div>
                        <div style={{ fontSize: '0.82rem', color: '#6B7280' }}>{accountEmail}</div>
                        <span className="db-plan-badge" style={{ marginTop: 4, display: 'inline-block' }}>PRO Plan</span>
                      </div>
                    </div>

                    <div className="db-form-group-row" style={{ marginTop: 10 }}>
                      <div>
                        <label className="db-form-label">Full Name</label>
                        <input type="text" className="db-form-input" value={formName} onChange={e => setFormName(e.target.value)} />
                      </div>
                      <div>
                        <label className="db-form-label">Username</label>
                        <input type="text" className="db-form-input" value={formUsername} onChange={e => setFormUsername(e.target.value)} />
                        <span style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 4, display: 'block' }}>hiprofile.com/{formUsername}</span>
                      </div>
                    </div>

                    <div>
                      <label className="db-form-label">Email Address</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input type="email" className="db-form-input" style={{ paddingRight: 80 }} value={accountEmail} onChange={e => setAccountEmail(e.target.value)} />
                        <span className="db-verified-indicator" style={{ position: 'absolute', right: 16 }}>Verified ✓</span>
                      </div>
                    </div>

                    <div>
                      <label className="db-form-label">Phone Number</label>
                      <input type="text" className="db-form-input" placeholder="+91 XXXXX XXXXX" value={accountPhone} onChange={e => setAccountPhone(e.target.value)} />
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      <button className="db-btn db-btn-primary" onClick={() => { setProfileName(formName); setClaimedUsername(formUsername); toast('Account updated'); }}>
                        Save Changes
                      </button>
                      <button className="db-btn db-btn-secondary" onClick={() => { setFormName(profileName || 'Foxy Man'); setFormUsername(claimedUsername || 'foxyman'); }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Notifications Settings */}
                {activeSettingsTab === 'notifications' && (
                  <div className="db-form-section">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12 }}>
                      Notification Preferences
                    </h3>
                    
                    <div className="db-notification-item">
                      <div className="db-notification-left">
                        <span className="db-notification-title">✉️ Email Notifications</span>
                        <span className="db-notification-desc">Receive updates via email</span>
                      </div>
                      <label className="db-toggle-switch-wrapper">
                        <input type="checkbox" checked={settingEmail} onChange={e => setSettingEmail(e.target.checked)} />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>

                    <div className="db-notification-item">
                      <div className="db-notification-left">
                        <span className="db-notification-title">👁️ Profile View Alerts</span>
                        <span className="db-notification-desc">Get notified when someone views</span>
                      </div>
                      <label className="db-toggle-switch-wrapper">
                        <input type="checkbox" checked={settingAlerts} onChange={e => setSettingAlerts(e.target.checked)} />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>

                    <div className="db-notification-item">
                      <div className="db-notification-left">
                        <span className="db-notification-title">🔗 Link Click Alerts</span>
                        <span className="db-notification-desc">Notified on every link click</span>
                      </div>
                      <label className="db-toggle-switch-wrapper">
                        <input type="checkbox" checked={settingClicks} onChange={e => setSettingClicks(e.target.checked)} />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>

                    <div className="db-notification-item">
                      <div className="db-notification-left">
                        <span className="db-notification-title">📊 Weekly Report</span>
                        <span className="db-notification-desc">Summary every Monday morning</span>
                      </div>
                      <label className="db-toggle-switch-wrapper">
                        <input type="checkbox" checked={settingReport} onChange={e => setSettingReport(e.target.checked)} />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>

                    <div className="db-notification-item">
                      <div className="db-notification-left">
                        <span className="db-notification-title">🎁 Product Updates</span>
                        <span className="db-notification-desc">New features and announcements</span>
                      </div>
                      <label className="db-toggle-switch-wrapper">
                        <input type="checkbox" checked={settingUpdates} onChange={e => setSettingUpdates(e.target.checked)} />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>
                  </div>
                )}

                {/* 3. Privacy & Security Settings */}
                {activeSettingsTab === 'privacy' && (
                  <div className="db-form-section">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12 }}>
                      Privacy &amp; Security
                    </h3>

                    <div className="db-notification-item">
                      <div className="db-notification-left">
                        <span className="db-notification-title">🌐 Public Profile</span>
                        <span className="db-notification-desc">Anyone can view your profile</span>
                      </div>
                      <label className="db-toggle-switch-wrapper">
                        <input type="checkbox" checked={privacyPublic} onChange={e => setPrivacyPublic(e.target.checked)} />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>

                    <div className="db-notification-item">
                      <div className="db-notification-left">
                        <span className="db-notification-title">🔍 Search Visibility</span>
                        <span className="db-notification-desc">Appear in search results</span>
                      </div>
                      <label className="db-toggle-switch-wrapper">
                        <input type="checkbox" checked={privacySearch} onChange={e => setPrivacySearch(e.target.checked)} />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>

                    <div className="db-notification-item">
                      <div className="db-notification-left">
                        <span className="db-notification-title">📊 Analytics Visibility</span>
                        <span className="db-notification-desc">Show view count on profile</span>
                      </div>
                      <label className="db-toggle-switch-wrapper">
                        <input type="checkbox" checked={privacyAnalytics} onChange={e => setPrivacyAnalytics(e.target.checked)} />
                        <span className="db-toggle-slider" />
                      </label>
                    </div>

                    {/* 2FA Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0', borderBottom: '1.5px solid #F3F4F6' }}>
                      <div className="db-notification-left">
                        <span className="db-notification-title">🔐 Two-Factor Authentication</span>
                        <span className="db-notification-desc">Extra security for your account</span>
                      </div>
                      <button
                        className="db-btn db-btn-secondary"
                        onClick={() => { setPrivacy2fa(!privacy2fa); toast(privacy2fa ? '2FA disabled' : '2FA activated successfully!'); }}
                        style={{ padding: '8px 18px', borderRadius: 8, background: privacy2fa ? '#D2F7E2' : '#FFF', color: privacy2fa ? '#00BA9D' : '#4B5563', borderColor: privacy2fa ? '#00BA9D' : '#E5E7EB' }}
                      >
                        {privacy2fa ? '✓ Enabled' : 'Enable'}
                      </button>
                    </div>

                    {/* Password Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 0' }}>
                      <div className="db-notification-left">
                        <span className="db-notification-title">Password</span>
                        <span className="db-notification-desc">Last changed 3 months ago</span>
                      </div>
                      <button className="db-btn db-btn-secondary" onClick={() => toast('Password change verification sent to email')} style={{ padding: '8px 18px', borderRadius: 8 }}>
                        Change Password
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. Billing & Plan Settings */}
                {activeSettingsTab === 'billing' && (
                  <div className="db-form-section">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12 }}>
                      Current Plan
                    </h3>

                    {/* Pro Active Card */}
                    <div style={{ background: '#FFFFFF', border: '1.5px solid #EBEBEF', borderRadius: 20, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#111' }}>PRO Plan</span>
                            <span className="db-paid-badge" style={{ fontSize: '0.7rem' }}>Active</span>
                          </div>
                          <span style={{ fontSize: '0.82rem', color: '#6B7280', fontWeight: 500, marginTop: 4, display: 'block' }}>Billed monthly - Next renewal: June 25, 2026</span>
                        </div>

                        {/* List of checkboxes */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                          {['Custom domain support', 'Advanced analytics & insights', 'Priority customer support'].map(feat => (
                            <div key={feat} className="db-plan-feature-item">
                              <span className="db-plan-feature-check">✓</span>
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button className="db-btn db-btn-primary" onClick={() => toast('Already on Pro Plan. Upgrade to Business?')} style={{ padding: '8px 18px', borderRadius: 8 }}>
                        Upgrade Plan
                      </button>
                    </div>

                    {/* All Plans Section */}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12, marginTop: 16 }}>
                      All Plans
                    </h3>

                    <div className="db-billing-plans-grid">
                      {/* Free Plan */}
                      <div className="db-plan-card">
                        <div>
                          <div className="db-plan-name">Free</div>
                          <div className="db-plan-price">$0<span className="db-plan-price-sub">/forever</span></div>
                          <ul className="db-plan-features-list">
                            <li className="db-plan-feature-item"><span className="db-plan-feature-check">✓</span> 1 page</li>
                            <li className="db-plan-feature-item"><span className="db-plan-feature-check">✓</span> Basic analytics</li>
                            <li className="db-plan-feature-item"><span className="db-plan-feature-check">✓</span> hiprofile.com/username</li>
                          </ul>
                        </div>
                        <button className="db-plan-btn" onClick={() => toast('Switched to Free account plan successfully.')}>Switch to Free</button>
                      </div>

                      {/* Pro Plan */}
                      <div className="db-plan-card active">
                        <span className="db-plan-badge-top">Current</span>
                        <div>
                          <div className="db-plan-name">PRO</div>
                          <div className="db-plan-price">$9<span className="db-plan-price-sub">/per month</span></div>
                          <ul className="db-plan-features-list">
                            <li className="db-plan-feature-item"><span className="db-plan-feature-check">✓</span> Custom domain</li>
                            <li className="db-plan-feature-item"><span className="db-plan-feature-check">✓</span> Advanced analytics</li>
                            <li className="db-plan-feature-item"><span className="db-plan-feature-check">✓</span> Priority support</li>
                          </ul>
                        </div>
                        <button className="db-plan-btn active">Current Plan</button>
                      </div>

                      {/* Business Plan */}
                      <div className="db-plan-card">
                        <div>
                          <div className="db-plan-name">Business</div>
                          <div className="db-plan-price">$29<span className="db-plan-price-sub">/per month</span></div>
                          <ul className="db-plan-features-list">
                            <li className="db-plan-feature-item"><span className="db-plan-feature-check">✓</span> 10 team members</li>
                            <li className="db-plan-feature-item"><span className="db-plan-feature-check">✓</span> White-label</li>
                            <li className="db-plan-feature-item"><span className="db-plan-feature-check">✓</span> API access</li>
                          </ul>
                        </div>
                        <button className="db-plan-btn" onClick={() => toast('Thank you for upgrading to Business!')}>Switch to Business</button>
                      </div>
                    </div>

                    {/* Billing History Section */}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12, marginTop: 24 }}>
                      Billing History
                    </h3>

                    <div className="db-billing-history-list">
                      {[
                        { date: 'May 25, 2026', desc: 'PRO Plan — Monthly' },
                        { date: 'Apr 25, 2026', desc: 'PRO Plan — Monthly' },
                        { date: 'Mar 25, 2026', desc: 'PRO Plan — Monthly' }
                      ].map((item, index) => (
                        <div key={index} className="db-billing-history-item">
                          <div className="db-billing-date-info">
                            <span className="db-billing-date-title">{item.date}</span>
                            <span className="db-billing-date-sub">{item.desc}</span>
                          </div>
                          <div className="db-billing-amount-info">
                            <span className="db-billing-amount-value">$9.00</span>
                            <span className="db-paid-badge">Paid</span>
                            <a href="#" className="db-billing-download-link" onClick={(e) => { e.preventDefault(); toast('Invoice PDF download triggered'); }}>Download</a>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

                {/* 5. Domain Settings */}
                {activeSettingsTab === 'domain' && (
                  <div className="db-form-section">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12 }}>
                      Current Domain
                    </h3>

                    {/* Default Domain box */}
                    <div style={{ background: '#FFFFFF', border: '1.5px solid #EBEBEF', borderRadius: 20, padding: '16px 24px', display: 'flex', justifyBetween: 'center', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: '1.2rem' }}>🌐</span>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>hiprofile.com/{formUsername}</span>
                        <span className="db-paid-badge" style={{ background: '#E0F2FE', color: '#0284C7', fontSize: '0.72rem' }}>Default</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: '1.1rem', cursor: 'pointer', color: '#9CA3AF' }} onClick={() => handleCopyToClipboard(`hiprofile.com/${formUsername}`)} title="Copy URL">📋</span>
                        <a href={`/bento`} target="_blank" style={{ fontSize: '1.1rem', cursor: 'pointer', color: '#9CA3AF', textDecoration: 'none' }} title="Visit URL">↗</a>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12, marginTop: 16 }}>
                      Custom Domain
                    </h3>

                    {/* Yellow Banner */}
                    <div className="db-warning-banner">
                      <span>✦</span>
                      <span>PRO feature — Custom domains are available on the PRO plan.</span>
                    </div>

                    <div>
                      <label className="db-form-label">Custom Domain</label>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <input
                          type="text"
                          className="db-form-input"
                          placeholder="yourdomain.com"
                          value={customDomain}
                          onChange={e => setCustomDomain(e.target.value)}
                        />
                        <button className="db-btn db-btn-primary" onClick={() => { if (!customDomain) { toast('Please input your domain name!'); return; } toast(`Connecting to ${customDomain}...`); }} style={{ flexShrink: 0 }}>
                          Connect Domain
                        </button>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 4, display: 'block' }}>Enter your domain without https:// (e.g. yourdomain.com)</span>
                    </div>

                    {/* DNS setup instructions */}
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12, marginTop: 24 }}>
                      DNS Setup Instructions
                    </h3>

                    <div className="db-dns-list-box">
                      {/* CNAME */}
                      <div className="db-dns-row">
                        <div className="db-dns-row-left">
                          <span className="db-dns-badge-type">cname</span>
                          <span className="db-dns-host-label">@</span>
                          <span className="db-dns-host-value">hiprofile.com</span>
                        </div>
                        <span className="db-dns-copy-icon" onClick={() => handleCopyToClipboard('hiprofile.com')} title="Copy Record Value">📋</span>
                      </div>

                      {/* TXT */}
                      <div className="db-dns-row">
                        <div className="db-dns-row-left">
                          <span className="db-dns-badge-type">txt</span>
                          <span className="db-dns-host-label">_verify</span>
                          <span className="db-dns-host-value">hp-verify-{formUsername}</span>
                        </div>
                        <span className="db-dns-copy-icon" onClick={() => handleCopyToClipboard(`hp-verify-${formUsername}`)} title="Copy Record Value">📋</span>
                      </div>
                    </div>

                  </div>
                )}


                {/* 6. Appearance Settings */}
                {activeSettingsTab === 'appearance' && (
                  <div className="db-form-section">
                    {/* Accent Color section */}
                    <div style={{ marginBottom: 24 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: textColor }}>Accent Color</h4>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                        {ACCENT_COLORS.map(c => {
                          const isSelected = tempAccentColor === c.value
                          return (
                            <button
                              key={c.value}
                              onClick={() => setTempAccentColor(c.value)}
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: c.value,
                                border: isSelected ? '3px solid #FFFFFF' : 'none',
                                outline: isSelected ? `2.5px solid ${c.value}` : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                              }}
                              title={c.name}
                            />
                          )
                        })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: tempAccentColor, border: '1.5px solid #E5E7EB' }} />
                        <span style={{ fontSize: '0.85rem', color: subTextColor }}>
                          Selected: <strong style={{ color: textColor, fontWeight: 700 }}>{tempAccentColor.toUpperCase()}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Font Size section */}
                    <div style={{ marginBottom: 24, borderTop: `1.5px solid ${borderColor}`, paddingTop: 20 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 12, color: textColor }}>Font Size</h4>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                        {['small', 'medium', 'large'].map(sz => (
                          <div
                            key={sz}
                            style={fontSizeCardStyle(tempFontSize === sz)}
                            onClick={() => setTempFontSize(sz)}
                          >
                            {sz.charAt(0).toUpperCase() + sz.slice(1)}
                          </div>
                        ))}
                      </div>

                      <h5 style={{ fontSize: '0.82rem', fontWeight: 600, color: subTextColor, marginBottom: 8 }}>Profile Card Font</h5>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {['Inter', 'Poppins', 'DM Sans', 'Nunito'].map(fnt => (
                          <button
                            key={fnt}
                            style={fontPillStyle(tempProfileCardFont === fnt)}
                            onClick={() => setTempProfileCardFont(fnt)}
                          >
                            {fnt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div style={{ display: 'flex', gap: 12, marginTop: 32, borderTop: `1.5px solid ${borderColor}`, paddingTop: 20 }}>
                      <button
                        className="db-btn"
                        onClick={handleSaveAppearance}
                        style={{
                          background: tempAccentColor,
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '12px 24px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: `0 4px 14px rgba(0,0,0,0.05)`
                        }}
                      >
                        Save Appearance
                      </button>
                      <button
                        className="db-btn"
                        onClick={handleResetAppearance}
                        style={{
                          background: isDark ? '#1F1F24' : '#FFFFFF',
                          border: `1.5px solid ${isDark ? '#2E2E35' : '#E5E7EB'}`,
                          color: textColor,
                          padding: '12px 24px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Reset to Default
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. Danger Zone Settings */}
                {activeSettingsTab === 'danger' && (
                  <div className="db-form-section">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, borderBottom: '1.5px solid #F3F4F6', paddingBottom: 12, marginBottom: 20, color: '#EF4444' }}>
                      Danger Zone
                    </h3>

                    {/* Deactivate Account */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1.5px solid #F3F4F6' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#111111' }}>Deactivate Account</span>
                        <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Temporarily disable your profile</span>
                      </div>
                      <button
                        className="db-btn"
                        onClick={() => toast('Deactivation confirmation sent to email')}
                        style={{
                          background: '#FFFFFF',
                          border: '1.5px solid #E5E7EB',
                          color: '#4B5563',
                          padding: '8px 18px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Deactivate
                      </button>
                    </div>

                    {/* Delete Account */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#EF4444' }}>Delete Account</span>
                        <span style={{ fontSize: '0.85rem', color: '#6B7280' }}>Permanently delete all your data</span>
                      </div>
                      <button
                        className="db-btn"
                        onClick={() => {
                          const confirm = window.confirm("Are you absolutely sure you want to permanently delete your account? This action cannot be undone.");
                          if (confirm) {
                            toast('Account deletion request queued');
                          }
                        }}
                        style={{
                          background: '#FEE2E2',
                          color: '#EF4444',
                          border: 'none',
                          padding: '8px 18px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                )}

                {/* Other fallback panels */}
                {activeSettingsTab !== 'account' && activeSettingsTab !== 'notifications' && activeSettingsTab !== 'privacy' && activeSettingsTab !== 'billing' && activeSettingsTab !== 'domain' && activeSettingsTab !== 'appearance' && activeSettingsTab !== 'danger' && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
                    <span style={{ fontSize: '3rem' }}>🔒</span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 12, color: '#111' }}>Premium Settings Area</h3>
                    <p style={{ fontSize: '0.9rem', color: '#888', marginTop: 4 }}>This sub-section configuration is active on your Pro account.</p>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      </main>

      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import { useAuth } from '../context/AuthContext'
import Toast, { useToast } from '../components/Toast'
import EditPhotoModal from '../components/EditPhotoModal'
import { enhanceBioApi, getProfileMeApi } from '../services/profileApi'

function AvatarDisplay({ avatar }) {
  if (avatar?.type === 'file' && avatar.data) {
    return <img src={avatar.data} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
  }
  if (avatar?.type === 'emoji' && avatar.data) {
    return <span style={{ fontSize: '4.2rem' }}>{avatar.data}</span>
  }
  return <span style={{ fontSize: '3rem' }}>👤</span>
}

export default function Profile() {
  const { avatar, setAvatar, claimedUsername, profileName, setProfileName, profileBio, setProfileBio } = useOnboarding()
  const { accessToken, user } = useAuth()
  const [name, setName] = useState(() => {
    if (user?.fullName) return user.fullName
    if (profileName) return profileName
    if (claimedUsername && claimedUsername.toLowerCase() !== 'hi') {
      return claimedUsername.charAt(0).toUpperCase() + claimedUsername.slice(1)
    }
    return ''
  })
  const [bio, setBio] = useState(() => profileBio || '')
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  const fileInputRef = useRef(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSrc, setModalSrc] = useState(null)
  const [fileName, setFileName] = useState('')

  // AI Enhancement state
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [remainingEnhancements, setRemainingEnhancements] = useState(2)

  useEffect(() => {
    if (user?.fullName) {
      setName(user.fullName)
    }
  }, [user?.fullName])

  // Fetch current enhancement count from server
  useEffect(() => {
    const fetchEnhancementCount = async () => {
      if (!accessToken) return
      try {
        const res = await getProfileMeApi(accessToken)
        if (res.success && res.data) {
          const count = res.data.enhancementCount ?? res.data.profile?.bioEnhancementCount ?? 0
          setRemainingEnhancements(Math.max(0, 2 - count))
        }
      } catch (err) {
        console.error('Failed to load profile enhancement count', err)
      }
    }
    fetchEnhancementCount()
  }, [accessToken])

  const avatarBg = avatar?.type === 'emoji' ? avatar.bg : ''

  const handleAvatarClick = () => {
    if (avatar?.type === 'file' && (avatar.rawImageSrc || avatar.data)) {
      setModalSrc(avatar.rawImageSrc || avatar.data)
      setFileName('profile_photo.jpg')
      setModalOpen(true)
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setModalSrc(ev.target.result)
      setModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleEditorSave = (croppedDataUrl, editorState) => {
    const updatedAvatar = {
      type: 'file',
      data: croppedDataUrl,
      rawImageSrc: modalSrc,
      editorState: editorState,
      transform: '',
      bg: ''
    }
    setAvatar(updatedAvatar)
    setModalOpen(false)
    toast('Profile image framing updated!')

    if (accessToken) {
      fetch('http://localhost:3001/api/profile/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({ avatar: updatedAvatar, profileImage: croppedDataUrl })
      }).catch(err => console.error('Failed to sync avatar', err))
    }
  }

  const handleEnhanceBio = async () => {
    if (isEnhancing) return
    if (!bio || !bio.trim()) {
      toast('Please enter your bio before enhancing with AI!')
      return
    }

    if (!accessToken) {
      toast('Please log in to use AI Bio Enhancement.')
      return
    }

    if (remainingEnhancements <= 0) {
      toast('AI enhancement limit reached. You can continue editing your bio manually.')
      return
    }

    setIsEnhancing(true)
    try {
      const res = await enhanceBioApi(bio.trim(), accessToken)
      if (res.success && res.enhancedBio) {
        setBio(res.enhancedBio)
        if (typeof res.remainingEnhancements === 'number') {
          setRemainingEnhancements(res.remainingEnhancements)
        } else {
          setRemainingEnhancements(prev => Math.max(0, prev - 1))
        }
        toast('✨ Bio enhanced with AI! Review and edit if needed.')
      } else {
        const errorMsg = res.message || 'Failed to enhance bio with AI.'
        toast(errorMsg)
        if (typeof res.remainingEnhancements === 'number') {
          setRemainingEnhancements(res.remainingEnhancements)
        }
      }
    } catch (err) {
      console.error('[AI Enhancement Error]', err)
      toast(err.message || 'An error occurred during AI bio enhancement.')
    } finally {
      setIsEnhancing(false)
    }
  }

  const submitBio = async (bioVal, nameVal) => {
    try {
      if (accessToken) {
        await fetch('http://localhost:3001/api/profile/bio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          credentials: 'include',
          body: JSON.stringify({ bio: bioVal, fullName: nameVal })
        })
      }
    } catch (e) {
      console.error('Failed to update bio on server', e)
    }
  }

  const handleNext = async () => {
    if (!name.trim()) { toast('Please enter your name!'); return }
    setProfileName(name.trim())
    setProfileBio(bio.trim())
    await submitBio(bio.trim(), name.trim())
    toast('Profile set successfully!')
    setTimeout(() => navigate('/setup'), 800)
  }

  const handleSkip = async () => {
    await submitBio(bio.trim() || '', name.trim() || '')
    navigate('/setup')
  }

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 50%,#F9FAFC 0%,#F3F5FA 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 520, textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Avatar Container with Edit Capability */}
        <div
          onClick={handleAvatarClick}
          title="Click to edit or change profile picture"
          style={{
            width: 130,
            height: 130,
            borderRadius: '50%',
            border: '3px solid #E2E2E8',
            background: avatarBg || '#F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginBottom: 24,
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <AvatarDisplay avatar={avatar} />
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Name Input */}
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', maxWidth: 380, border: 'none', background: 'transparent', textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800, color: '#111', outline: 'none', marginBottom: 24 }}
        />

        {/* Bio Textarea Container */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 440, marginBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <textarea
            placeholder="Your bio..."
            maxLength={500}
            value={bio}
            onChange={e => setBio(e.target.value)}
            style={{
              width: '100%',
              height: 110,
              borderRadius: 12,
              border: '1.5px solid #E2E2E8',
              background: '#fff',
              padding: '16px',
              boxSizing: 'border-box',
              fontFamily: 'var(--font-body)',
              fontSize: '1.05rem',
              color: '#111',
              resize: 'none',
              outline: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
            }}
          />

          {/* AI Bio Enhancement Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 10, padding: '0 4px' }}>
            <button
              type="button"
              onClick={handleEnhanceBio}
              disabled={isEnhancing || remainingEnhancements <= 0 || !bio.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 8,
                background: remainingEnhancements <= 0 ? '#F1F5F9' : (isEnhancing ? '#93C5FD' : '#2563EB'),
                color: remainingEnhancements <= 0 ? '#94A3B8' : '#FFFFFF',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: (remainingEnhancements <= 0 || isEnhancing || !bio.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: remainingEnhancements > 0 && !isEnhancing && bio.trim() ? '0 2px 8px rgba(37, 99, 235, 0.2)' : 'none'
              }}
            >
              <span>{isEnhancing ? '✨ Enhancing...' : '✨ Enhance with AI'}</span>
            </button>

            <span style={{ fontSize: '0.8rem', color: remainingEnhancements === 0 ? '#EF4444' : '#64748B', fontWeight: 500 }}>
              AI enhancements remaining: <strong>{remainingEnhancements}</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 14 }}>
          <button onClick={handleSkip} style={{ height: 46, padding: '0 28px', borderRadius: 10, background: '#fff', border: '1.5px solid #E2E2E8', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>Skip</button>
          <button onClick={handleNext} style={{ height: 46, padding: '0 28px', borderRadius: 10, background: '#3B82F6', color: '#fff', border: 'none', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.15)' }}>Next</button>
        </div>
      </div>

      <EditPhotoModal
        show={modalOpen}
        imageSrc={modalSrc}
        fileName={fileName}
        initialState={avatar?.editorState}
        onCancel={() => setModalOpen(false)}
        onSave={handleEditorSave}
      />
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

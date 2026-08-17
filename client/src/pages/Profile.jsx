import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import { useAuth } from '../context/AuthContext'
import Toast, { useToast } from '../components/Toast'
import EditPhotoModal from '../components/EditPhotoModal'

const BIOS = [
  'Product designer & creative technologist crafting intuitive digital experiences.',
  'Software engineer obsessed with clean code, performance, and great UX.',
  'Building the future of web applications, one line of code at a time.',
  'Designer, developer, and lifelong learner passionate about open source.'
]

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

  useEffect(() => {
    if (user?.fullName) {
      setName(user.fullName)
    }
  }, [user?.fullName])

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

        {/* Bio Textarea */}
        <div style={{ position: 'relative', width: '100%', maxWidth: 440, marginBottom: 32 }}>
          <textarea
            placeholder="Your bio..."
            maxLength={160}
            value={bio}
            onChange={e => setBio(e.target.value)}
            style={{ width: '100%', height: 110, borderRadius: 12, border: '1.5px solid #E2E2E8', background: '#fff', padding: '16px 42px 16px 16px', boxSizing: 'border-box', fontFamily: 'var(--font-body)', fontSize: '1.05rem', color: '#111', resize: 'none', outline: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
          />
          <span
            onClick={() => setBio(BIOS[Math.floor(Math.random() * BIOS.length)])}
            title="AI Bio Helper"
            style={{ position: 'absolute', right: 16, top: 16, fontSize: '1.25rem', color: '#3B82F6', cursor: 'pointer', userSelect: 'none' }}
          >
            ✨
          </span>
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

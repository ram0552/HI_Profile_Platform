import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast, { useToast } from '../components/Toast'
import { getProfileMeApi, updateProfileMeApi } from '../services/profileApi'
import ResetPasswordSection from '../components/ResetPasswordSection'
import EditPhotoModal from '../components/EditPhotoModal'
import {
  ArrowLeft,
  Camera,
  Trash2,
  UploadCloud,
  Save,
  Crop
} from 'lucide-react'

export default function EditProfile() {
  const { user: authUser, accessToken, loading: authLoading, fetchMe } = useAuth()
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  const fileInputRef = useRef(null)

  // Data Loading & Form State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [profile, setProfile] = useState(null)
  const [userData, setUserData] = useState(null)

  const [tempFilePreview, setTempFilePreview] = useState(null)
  const [isPhotoRemoved, setIsPhotoRemoved] = useState(false)

  // Image Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editorImageSrc, setEditorImageSrc] = useState(null)
  const [selectedFileName, setSelectedFileName] = useState('')

  const [editForm, setEditForm] = useState({
    fullName: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    profileImage: '',
    avatar: { type: null, data: '', bg: '' },
    selectedFileName: '',
    github: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    youtube: ''
  })

  // Auth Redirect Guard
  useEffect(() => {
    if (!authLoading && !accessToken) {
      navigate('/login')
    }
  }, [authLoading, accessToken, navigate])

  // Fetch Existing Profile Data
  const loadProfileData = async () => {
    if (!accessToken) return
    setLoading(true)
    setError(null)

    try {
      const profileRes = await getProfileMeApi(accessToken)
      if (profileRes.success && profileRes.data) {
        const p = profileRes.data.profile || {}
        const u = profileRes.data.user || authUser || {}
        const s = p.socialLinks || {}

        setProfile(p)
        setUserData(u)

        setEditForm({
          fullName: u.fullName || '',
          username: u.username || '',
          bio: p.bio || '',
          location: s.location || p.location || '',
          website: s.website || '',
          profileImage: p.profileImage || '',
          avatar: p.avatar || { type: null, data: '', bg: '' },
          selectedFileName: '',
          github: s.github || '',
          linkedin: s.linkedin || '',
          twitter: s.twitter || '',
          instagram: s.instagram || '',
          youtube: s.youtube || ''
        })
      } else {
        setError(profileRes.message || 'Failed to load profile information.')
      }
    } catch (err) {
      console.error('[EditProfile Load Error]', err)
      setError(err.message || 'Error fetching profile details.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (accessToken) {
      loadProfileData()
    }
  }, [accessToken])

  // Handle Photo Selection -> Open Editor Modal
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Selected file must be a valid image format (JPG, PNG, WEBP, SVG).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size exceeds the 5MB limit.')
      return
    }

    setError(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result || ''
      setEditorImageSrc(dataUrl)
      setSelectedFileName(file.name)
      setEditorInitialState(null)
      setIsEditorOpen(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsDataURL(file)
  }

  const [editorInitialState, setEditorInitialState] = useState(null)

  // Handle Editor Save Callback (Cropped Data URL + transform state)
  const handleEditorSave = (croppedDataUrl, editorState) => {
    setTempFilePreview(croppedDataUrl)
    setEditorInitialState(editorState)
    setEditForm((prev) => ({
      ...prev,
      profileImage: croppedDataUrl,
      selectedFileName: selectedFileName || 'profile_photo.jpg',
      avatar: {
        type: 'file',
        data: croppedDataUrl,
        rawImageSrc: editorState?.rawImageSrc || editorImageSrc || croppedDataUrl,
        editorState: editorState,
        bg: ''
      }
    }))
    setIsPhotoRemoved(false)
    setIsEditorOpen(false)
    toast('Profile photo framed & ready to save!')
  }

  // Handle Editor Cancel Callback
  const handleEditorCancel = () => {
    setIsEditorOpen(false)
  }

  // Handle Re-Opening Editor for Current Photo
  const handleOpenAdjustPhoto = () => {
    const rawPhoto = editForm.avatar?.rawImageSrc || editorImageSrc || tempFilePreview || editForm.profileImage
    if (rawPhoto && !isPhotoRemoved) {
      setEditorImageSrc(rawPhoto)
      setEditorInitialState(editForm.avatar?.editorState || editorInitialState)
      setSelectedFileName('Current Profile Photo')
      setIsEditorOpen(true)
    } else {
      fileInputRef.current?.click()
    }
  }

  // Handle Photo Removal
  const handleRemovePhoto = () => {
    setIsPhotoRemoved(true)
    setTempFilePreview(null)
    setEditForm((prev) => ({
      ...prev,
      profileImage: '',
      avatar: { type: null, data: '', bg: '' },
      selectedFileName: ''
    }))
    setError(null)
    toast('Profile photo removed. Initials fallback active.')
  }

  // Calculate Initials from Full Name
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'U'
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) return 'U'
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  // Handle Form Submission / Save Changes
  const handleSubmit = async (e) => {
    e.preventDefault()

    setSaving(true)
    setError(null)

    try {
      const payload = {
        fullName: editForm.fullName,
        username: editForm.username,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website,
        profileImage: isPhotoRemoved ? '' : (editForm.profileImage || tempFilePreview || ''),
        profilePicture: isPhotoRemoved ? '' : (editForm.profileImage || tempFilePreview || ''),
        avatar: isPhotoRemoved ? { type: null, data: '', bg: '' } : editForm.avatar,
        socialLinks: {
          github: editForm.github,
          linkedin: editForm.linkedin,
          twitter: editForm.twitter,
          instagram: editForm.instagram,
          youtube: editForm.youtube,
          website: editForm.website,
          location: editForm.location
        }
      }

      const res = await updateProfileMeApi(payload, accessToken)

      if (res.success && res.data) {
        if (fetchMe) await fetchMe()
        toast('Profile updated successfully!')
        setTimeout(() => {
          navigate('/dashboard')
        }, 600)
      } else {
        const errorMsg = res.message || 'Failed to save profile changes.'
        setError(errorMsg)
        toast(errorMsg)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err) {
      console.error('[EditProfile Save Error]', err)
      const errorMsg = err.message || 'An error occurred while saving profile changes.'
      setError(errorMsg)
      toast(errorMsg)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#64748B' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 14, fontWeight: 600 }}>Loading profile editor...</p>
        </div>
      </div>
    )
  }

  const currentInitials = getInitials(editForm.fullName || userData?.fullName || editForm.username)

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: 60 }}>
      {toastShow && <Toast message={toastMsg} />}

      {/* Inline Hover Styles */}
      <style>{`
        .avatar-hover-container:hover .avatar-hover-overlay {
          opacity: 1 !important;
        }
      `}</style>

      {/* Top Header / Navigation Bar */}
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F1F5F9', border: 'none', color: '#475569', padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>

          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: '#0F172A' }}>Edit Profile</h1>

          <div style={{ width: 120 }} /> {/* Spacer for symmetry */}
        </div>
      </header>

      {/* Main Page Container */}
      <main style={{ maxWidth: 760, margin: '32px auto 0', padding: '0 24px' }}>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '14px 18px', borderRadius: 14, fontSize: 14, marginBottom: 24 }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ background: '#FFFFFF', borderRadius: 24, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', padding: 36, display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* 1. TOP CENTER PROFILE PICTURE SECTION */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

            {/* Circular Profile Picture (140px) */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="avatar-hover-container"
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 46,
                fontWeight: 800,
                border: '4px solid #FFFFFF',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.18)',
                marginBottom: 16
              }}
            >
              {!isPhotoRemoved && tempFilePreview ? (
                <img src={tempFilePreview} alt="Selected Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : !isPhotoRemoved && editForm.profileImage ? (
                <img src={editForm.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{currentInitials}</span>
              )}

              {/* Hover Overlay: "Change Profile Picture" */}
              <div
                className="avatar-hover-overlay"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(15, 23, 42, 0.7)',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                  padding: 8
                }}
              >
                <Camera size={28} />
                <span style={{ fontSize: 11, fontWeight: 700, marginTop: 6, textAlign: 'center', lineHeight: 1.2 }}>
                  Change Profile Picture
                </span>
              </div>
            </div>

            {/* Hidden File Input & Photo Action Buttons */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <UploadCloud size={16} />
                <span>Upload New Picture</span>
              </button>

              {(!isPhotoRemoved && (tempFilePreview || editForm.profileImage)) && (
                <button
                  type="button"
                  onClick={handleOpenAdjustPhoto}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Crop size={15} />
                  <span>Adjust Framing / Crop</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRemovePhoto}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', color: '#64748B', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                <Trash2 size={15} />
                <span>Remove Photo</span>
              </button>
            </div>

            <span style={{ fontSize: 12, color: '#94A3B8', marginTop: 10 }}>
              Hover over picture or click button to upload and edit framing (JPG, PNG, WEBP, max 5MB).
            </span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: 0 }} />

          {/* 2. PROFILE INFORMATION FIELDS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A' }}>Profile Information</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Full Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Display Name</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                  required
                />
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>Public URL: {window.location.origin}/{editForm.username || 'username'}</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Biography (Bio)</label>
              <textarea
                rows={3}
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell the world about yourself..."
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none', resize: 'vertical' }}
                maxLength={500}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="San Francisco, CA"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Website URL</label>
                <input
                  type="text"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://mywebsite.com"
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 14, outline: 'none' }}
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: 0 }} />

          {/* 3. RESET PASSWORD & SECURITY SECTION */}
          <ResetPasswordSection accessToken={accessToken} toast={toast} />

          <hr style={{ border: 'none', borderTop: '1px solid #F1F5F9', margin: 0 }} />


          {/* 4. BOTTOM ACTION BUTTONS */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, paddingTop: 8 }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{ background: '#F1F5F9', color: '#475569', border: 'none', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#4F46E5', color: '#FFFFFF', border: 'none', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>
      </main>

      {/* Production-Grade Image Upload & Crop Editor Modal */}
      <EditPhotoModal
        show={isEditorOpen}
        imageSrc={editorImageSrc}
        fileName={selectedFileName}
        initialState={editorInitialState}
        onCancel={handleEditorCancel}
        onSave={handleEditorSave}
      />
    </div>
  )
}

import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboarding } from '../context/OnboardingContext'
import EditPhotoModal from '../components/EditPhotoModal'
import Toast, { useToast } from '../components/Toast'

const AVATARS = [
  { emoji: '👧', bg: '#FFC2E8' },
  { emoji: '🤠', bg: '#B0D5FF' },
  { emoji: '🧕', bg: '#D2C2FF' },
  { emoji: '😎', bg: '#C2FFD4' },
]

export default function Upload() {
  const fileRef = useRef(null)
  const { setAvatar } = useOnboarding()
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  const [selectedEmoji, setSelectedEmoji] = useState(null)
  const [selectedBg, setSelectedBg] = useState(null)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [previewTransform, setPreviewTransform] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalSrc, setModalSrc] = useState(null)
  const [fileName, setFileName] = useState('')
  const [source, setSource] = useState(null) // 'file' | 'emoji'

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = ev => { setModalSrc(ev.target.result); setModalOpen(true) }
    reader.readAsDataURL(file)
  }

  const handleSave = (src, tx, ty, scale) => {
    const transform = `translate(${tx * 0.6}px, ${ty * 0.6}px) scale(${scale * 0.9})`
    setPreviewSrc(src)
    setPreviewTransform(transform)
    setSelectedEmoji(null)
    setSource('file')
    setModalOpen(false)
    toast('Photo saved & cropped!')
  }

  const handleCancel = () => { setModalOpen(false); if (fileRef.current) fileRef.current.value = '' }

  const handleEmojiSelect = (emoji, bg) => {
    setSelectedEmoji(emoji); setSelectedBg(bg); setPreviewSrc(null); setSource('emoji')
    toast(`Selected avatar: ${emoji}`)
  }

  const handleContinue = () => {
    if (source === 'file') {
      setAvatar({ type: 'file', data: previewSrc, transform: previewTransform, bg: '' })
    } else if (source === 'emoji') {
      setAvatar({ type: 'emoji', data: selectedEmoji, transform: '', bg: selectedBg })
    }
    toast('Photo saved successfully!')
    setTimeout(() => navigate('/profile'), 1200)
  }

  return (
    <div style={{ background: 'radial-gradient(circle at 50% 50%,#F9FAFC 0%,#F3F5FA 100%)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 580, textAlign: 'center', animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Upload Circle */}
        <div className="avatar-preview-circle" onClick={() => fileRef.current?.click()}
          style={{ width: 160, height: 160, borderRadius: '50%', border: '2px dashed #D2D2D8', background: '#F8F9FA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden', marginBottom: 28 }}>
          {previewSrc ? (
            <img src={previewSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0, borderRadius: '50%', transform: previewTransform }} />
          ) : selectedEmoji ? (
            <span style={{ fontSize: '5rem', lineHeight: 1 }}>{selectedEmoji}</span>
          ) : (
            <>
              <span style={{ fontSize: '2.2rem', color: '#888', marginBottom: 8 }}>↑</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#888' }}>Upload Photo</span>
            </>
          )}
        </div>

        <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        <p className="upload-title" style={{ fontSize: '1.15rem', color: '#111', fontWeight: 500, marginBottom: 28, maxWidth: 460 }}>
          Upload your Photo, Or choose your vibe with avatars!
        </p>

        {/* Avatars Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
          {AVATARS.map(({ emoji, bg }) => (
            <div key={emoji} onClick={() => handleEmojiSelect(emoji, bg)}
              style={{ width: 52, height: 52, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', cursor: 'pointer', border: selectedEmoji === emoji ? '2px solid #3B82F6' : '2px solid transparent', transition: 'all 0.2s' }}>
              {emoji}
            </div>
          ))}
          <div onClick={() => fileRef.current?.click()}
            style={{ width: 52, height: 52, borderRadius: 12, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 600, color: '#888', cursor: 'pointer' }}>
            +
          </div>
        </div>

        <button className="btn-continue" onClick={handleContinue}
          style={{ width: '100%', maxWidth: 220, height: 50, background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 8px 24px rgba(59,130,246,0.15)' }}>
          Save &amp; Continue
        </button>
      </div>

      <EditPhotoModal show={modalOpen} imageSrc={modalSrc} fileName={fileName} onCancel={handleCancel} onSave={handleSave} />
      <Toast message={toastMsg} show={toastShow} />
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Toast, { useToast } from '../components/Toast'
import { getSocialIcon, getSocialBrandColor } from '../components/SocialIcons'
import { getProfileMeApi, updateProfileMeApi } from '../services/profileApi'
import { getUserBlocks } from '../services/bentoApi'
import {
  LayoutDashboard,
  User,
  Share2,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Download,
  Edit3,
  Globe,
  MapPin,
  Mail,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Lock,
  LogOut,
  ChevronRight,
  Eye,
  CheckCircle2,
  FileText,
  Code,
  Smartphone
} from 'lucide-react'

export default function Dashboard() {
  const { user: authUser, accessToken, loading: authLoading, logoutUser, fetchMe } = useAuth()
  const navigate = useNavigate()
  const [toastMsg, toastShow, toast] = useToast()

  // Tab State: 'summary' | 'share'
  const [activeTab, setActiveTab] = useState('summary')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Profile & Blocks Data
  const [loadingData, setLoadingData] = useState(true)
  const [dataError, setDataError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [userData, setUserData] = useState(null)
  const [userBlocks, setUserBlocks] = useState([])
  const [imgError, setImgError] = useState(false)

  const resolvedProfileImage = profile?.profileImage || (profile?.avatar?.type === 'file' ? profile.avatar.data : '') || userData?.profileImage || authUser?.profileImage || ''
  const avatarEmoji = profile?.avatar?.type === 'emoji' ? profile?.avatar?.data : null

  // Copy URL Feedback State
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedEmbed, setCopiedEmbed] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !accessToken) {
      navigate('/login')
    }
  }, [authLoading, accessToken, navigate])

  // Load Profile & Blocks Data
  const loadDashboardData = async () => {
    if (!accessToken) return;
    setLoadingData(true)
    setDataError(null)

    try {
      const [profileRes, blocksRes] = await Promise.all([
        getProfileMeApi(accessToken),
        getUserBlocks(accessToken)
      ]);

      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data.profile || {})
        setUserData(profileRes.data.user || authUser || {})
      } else {
        setDataError(profileRes.message || 'Failed to load profile details')
      }

      if (blocksRes.success && Array.isArray(blocksRes.data)) {
        setUserBlocks(blocksRes.data)
      } else if (Array.isArray(blocksRes)) {
        setUserBlocks(blocksRes)
      }
    } catch (err) {
      console.error('[Dashboard Load Error]', err)
      setDataError(err.message || 'An error occurred while loading dashboard data')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (accessToken) {
      loadDashboardData()
    }
  }, [accessToken])

  // Calculate Resource Limits & Usage
  const currentUsername = userData?.username || authUser?.username || 'user'
  const publicProfileUrl = `${window.location.origin}/${currentUsername}`
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicProfileUrl)}`

  const totalBlocksCount = userBlocks.length
  const imageBlocksCount = userBlocks.filter(b => b.blockType === 'image').length
  const socialBlocksCount = userBlocks.filter(b => ['github', 'linkedin', 'instagram', 'twitter', 'youtube'].includes(b.blockType)).length
  const videoBlocksCount = userBlocks.filter(b => b.blockType === 'youtube').length

  const completionPercent = userData?.onboarding?.completionPercentage || (
    profile?.bio ? 100 : 75
  )

  const copyToClipboard = (text, type = 'url') => {
    navigator.clipboard.writeText(text)
    if (type === 'url') {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } else {
      setCopiedEmbed(true)
      setTimeout(() => setCopiedEmbed(false), 2000)
    }
    toast('Copied to clipboard!')
  }

  // Download QR Code image
  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeImageUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${currentUsername}-qr-code.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(blobUrl)
      toast('QR Code downloaded!')
    } catch (e) {
      toast('Opening QR code image in new tab...')
      window.open(qrCodeImageUrl, '_blank')
    }
  }

  if (authLoading || (loadingData && !profile)) {
    return (
      <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="bento-skeleton-item" style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 18, color: '#475569', fontWeight: 600 }}>Loading Dashboard...</h2>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'Inter, system-ui, sans-serif', color: '#0F172A', display: 'flex', flexDirection: 'column' }}>
      <Toast message={toastMsg} show={toastShow} />

      {/* Top Header Navbar */}
      <header style={{ height: 64, background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', sticky: 'top', top: 0, zIndex: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: 18 }}>
            H
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0F172A', lineHeight: 1.2 }}>Hi-Profile Dashboard</h1>
            <span style={{ fontSize: 12, color: '#64748B' }}>Personal Identity Suite</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => window.open(publicProfileUrl, '_blank')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <ExternalLink size={14} />
            <span>View Public Profile</span>
          </button>

          <button
            onClick={() => navigate('/bento')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#4F46E5', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#FFFFFF', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            <Layers size={14} />
            <span>Edit Bento Blocks</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div style={{ flexGrow: 1, maxWidth: 1280, width: '100%', margin: '0 auto', padding: '24px 16px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>

        {/* Persistent Left Sidebar Navigation */}
        <aside style={{ background: '#FFFFFF', borderRadius: 16, padding: 16, border: '1px solid #E2E8F0', height: 'fit-content', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ padding: '8px 12px 16px', borderBottom: '1px solid #F1F5F9', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dashboard Menu</div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => setActiveTab('summary')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                background: activeTab === 'summary' ? '#EEF2FF' : 'transparent',
                color: activeTab === 'summary' ? '#4F46E5' : '#475569'
              }}
            >
              <LayoutDashboard size={18} color={activeTab === 'summary' ? '#4F46E5' : '#64748B'} />
              <span>Profile Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('share')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                background: activeTab === 'share' ? '#EEF2FF' : 'transparent',
                color: activeTab === 'share' ? '#4F46E5' : '#475569'
              }}
            >
              <Share2 size={18} color={activeTab === 'share' ? '#4F46E5' : '#64748B'} />
              <span>Share Profile</span>
            </button>
          </nav>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => navigate('/edit-profile')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#334155', background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer' }}
            >
              <Edit3 size={16} color="#64748B" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => logoutUser()}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', marginTop: 4 }}
            >
              <LogOut size={16} color="#EF4444" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {dataError && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '14px 18px', borderRadius: 12, fontSize: 14 }}>
              <strong>Notice:</strong> {dataError}
            </div>
          )}

          {/* TAB 1: PROFILE SUMMARY */}
          {activeTab === 'summary' && (
            <>
              {/* Profile Header Card */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>

                {/* Avatar */}
                <div style={{ width: 96, height: 96, borderRadius: '50%', overflow: 'hidden', background: profile?.avatar?.bg || 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 36, fontWeight: 700, flexShrink: 0, border: '3px solid #FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                  {!imgError && resolvedProfileImage ? (
                    <img
                      src={resolvedProfileImage}
                      alt="Profile"
                      onError={() => setImgError(true)}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: profile?.avatar?.transform || 'none' }}
                    />
                  ) : avatarEmoji ? (
                    <span style={{ fontSize: 44, lineHeight: 1 }}>{avatarEmoji}</span>
                  ) : (
                    <span>{(userData?.fullName || currentUsername).substring(0, 2).toUpperCase()}</span>
                  )}
                </div>

                {/* Main Details */}
                <div style={{ flexGrow: 1, minWidth: 260 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#0F172A' }}>
                      {userData?.fullName || currentUsername}
                    </h2>
                    <span style={{ background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, padding: '2px 10px', borderRadius: 20 }}>
                      @{currentUsername}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 12px 0', color: '#475569', fontSize: 14, lineHeight: 1.5, maxWidth: 640 }}>
                    {profile?.bio || 'No biography specified yet. Click Edit Profile to add a summary about yourself.'}
                  </p>

                  <div style={{ display: 'flex', gap: 16, color: '#64748B', fontSize: 13, flexWrap: 'wrap' }}>
                    {profile?.socialLinks?.location && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={14} color="#64748B" />
                        {profile.socialLinks.location}
                      </span>
                    )}
                    {profile?.socialLinks?.website && (
                      <a href={profile.socialLinks.website.startsWith('http') ? profile.socialLinks.website : `https://${profile.socialLinks.website}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4F46E5', textDecoration: 'none' }}>
                        <Globe size={14} />
                        {profile.socialLinks.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} color="#64748B" />
                      Joined {new Date(userData?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Actions & Completion */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', minWidth: 200, flexShrink: 0 }}>
                  <button
                    onClick={() => navigate('/edit-profile')}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#4F46E5', color: '#FFFFFF', border: 'none', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)', width: '100%', justifyContent: 'center' }}
                  >
                    <Edit3 size={16} />
                    <span>Edit Profile</span>
                  </button>

                  <div style={{ width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                      <span>Profile Completion</span>
                      <span style={{ color: '#4F46E5' }}>{completionPercent}%</span>
                    </div>
                    <div style={{ width: '100%', height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${completionPercent}%`, height: '100%', background: 'linear-gradient(90deg, #4F46E5, #10B981)', borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Usage Grid */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px 0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Layers size={18} color="#4F46E5" />
                  <span>Profile Resource Usage & Limits</span>
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {/* Pages */}
                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Pages Allowed</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>1 / 1</div>
                    <div style={{ fontSize: 11, color: '#10B981', marginTop: 4 }}>Active Bento Profile</div>
                  </div>

                  {/* Images */}
                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Image Blocks</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{imageBlocksCount} / 5</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Standard Image Quota</div>
                  </div>

                  {/* Videos */}
                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Video Embeds</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{videoBlocksCount} / Unlimited</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>YouTube Widgets</div>
                  </div>

                  {/* Storage */}
                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Video Storage</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>0 B / 10 MB</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>External Storage Enabled</div>
                  </div>

                  {/* Advanced Widgets */}
                  <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Advanced Widgets</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{socialBlocksCount} / 20</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Apify Connected Widgets</div>
                  </div>
                </div>
              </div>

              {/* Personal Information & Connected Blocks Dual Column */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

                {/* Personal Information Card */}
                <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px 0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <User size={18} color="#4F46E5" />
                    <span>Personal Information</span>
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#64748B' }}>Full Name</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{userData?.fullName || 'Not specified'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#64748B' }}>Username</span>
                      <span style={{ fontWeight: 600, color: '#4F46E5' }}>@{currentUsername}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#64748B' }}>Email Address</span>
                      <span style={{ fontWeight: 600, color: '#0F172A' }}>{userData?.email || 'N/A'}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#64748B' }}>Account Status</span>
                      <span style={{ fontWeight: 600, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={14} /> Active
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #F1F5F9' }}>
                      <span style={{ color: '#64748B' }}>Selected Template</span>
                      <span style={{ fontWeight: 600, color: '#0F172A', textTransform: 'capitalize' }}>{profile?.selectedTemplate || 'bento'}</span>
                    </div>
                  </div>
                </div>

                {/* Connected Bento Blocks */}
                <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 20, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={18} color="#4F46E5" />
                      <span>Connected Bento Blocks ({totalBlocksCount})</span>
                    </h3>

                    <button
                      onClick={() => navigate('/bento')}
                      style={{ background: 'transparent', border: 'none', color: '#4F46E5', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
                    >
                      Manage <ChevronRight size={14} />
                    </button>
                  </div>

                  {userBlocks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px dashed #CBD5E1' }}>
                      <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#64748B' }}>No Bento blocks added yet.</p>
                      <button
                        onClick={() => navigate('/bento')}
                        style={{ background: '#4F46E5', color: '#FFFFFF', border: 'none', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Add Your First Block
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                      {userBlocks.map(block => {
                        const brandColor = getSocialBrandColor(block.blockType);
                        const handleStr = block.configuration?.handle || block.configuration?.username || block.configuration?.url || block.blockType;

                        return (
                          <div key={block._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${brandColor}15`, color: brandColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {getSocialIcon(block.blockType, 18, brandColor)}
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'capitalize' }}>
                                  {block.blockType} Block
                                </div>
                                <div style={{ fontSize: 11, color: '#64748B' }}>
                                  {handleStr.length > 24 ? handleStr.substring(0, 24) + '...' : handleStr}
                                </div>
                              </div>
                            </div>

                            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, background: block.visibility ? '#DCFCE7' : '#F1F5F9', color: block.visibility ? '#166534' : '#64748B' }}>
                              {block.visibility ? 'Visible' : 'Hidden'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

              </div>
            </>
          )}

          {/* TAB 2: SHARE PROFILE */}
          {activeTab === 'share' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Public URL Card */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', color: '#0F172A' }}>Public Profile Link</h3>
                <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 16px 0' }}>Share this link to showcase your public Bento profile anywhere.</p>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flexGrow: 1, background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', minWidth: 260 }}>
                    {publicProfileUrl}
                  </div>

                  <button
                    onClick={() => copyToClipboard(publicProfileUrl, 'url')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: copiedUrl ? '#10B981' : '#4F46E5', color: '#FFFFFF', border: 'none', padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                  >
                    {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={() => window.open(publicProfileUrl, '_blank')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', color: '#334155', border: '1px solid #CBD5E1', padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    <ExternalLink size={16} />
                    <span>Open Link</span>
                  </button>
                </div>
              </div>

              {/* QR Code & One-Click Social Share Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

                {/* QR Code Card */}
                <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                    <QrCode size={20} color="#4F46E5" />
                    <span>Profile QR Code</span>
                  </div>

                  <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: 16 }}>
                    <img src={qrCodeImageUrl} alt="Public Profile QR Code" style={{ width: 180, height: 180, display: 'block' }} />
                  </div>

                  <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px 0', maxWidth: 260 }}>
                    Scan with any smartphone camera to instantly open your public Hi-Profile.
                  </p>

                  <button
                    onClick={handleDownloadQR}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F8FAFC', color: '#334155', border: '1px solid #CBD5E1', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
                  >
                    <Download size={16} />
                    <span>Download QR Code (PNG)</span>
                  </button>
                </div>

                {/* Social Sharing Suite */}
                <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', color: '#0F172A' }}>One-Click Social Sharing</h3>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px 0' }}>Share your Hi-Profile directly to your favorite social networks.</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                    <a
                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out my Hi-Profile: ${publicProfileUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#25D36615', color: '#25D366', textDecoration: 'none', fontWeight: 600, fontSize: 13, border: '1px solid #25D36630' }}
                    >
                      {getSocialIcon('whatsapp', 18, '#25D366')}
                      <span>WhatsApp</span>
                    </a>

                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicProfileUrl)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#0A66C215', color: '#0A66C2', textDecoration: 'none', fontWeight: 600, fontSize: 13, border: '1px solid #0A66C230' }}
                    >
                      {getSocialIcon('linkedin', 18, '#0A66C2')}
                      <span>LinkedIn</span>
                    </a>

                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(publicProfileUrl)}&text=${encodeURIComponent('Check out my Hi-Profile!')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#00000010', color: '#000000', textDecoration: 'none', fontWeight: 600, fontSize: 13, border: '1px solid #00000020' }}
                    >
                      {getSocialIcon('twitter', 18, '#000000')}
                      <span>X / Twitter</span>
                    </a>

                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(publicProfileUrl)}&text=${encodeURIComponent('Check out my Hi-Profile!')}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: '#229ED915', color: '#229ED9', textDecoration: 'none', fontWeight: 600, fontSize: 13, border: '1px solid #229ED930' }}
                    >
                      {getSocialIcon('telegram', 18, '#229ED9')}
                      <span>Telegram</span>
                    </a>
                  </div>

                  {navigator.share && (
                    <button
                      onClick={() => {
                        navigator.share({
                          title: `${userData?.fullName || currentUsername}'s Hi-Profile`,
                          url: publicProfileUrl
                        }).catch(() => { })
                      }}
                      style={{ marginTop: 16, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#4F46E5', color: '#FFFFFF', border: 'none', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      <Share2 size={16} />
                      <span>Use Native Device Share</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Website Embed Snippet & NFC Integration */}
              <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 24, border: '1px solid #E2E8F0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px 0', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Code size={18} color="#4F46E5" />
                  <span>Website Embed Snippet</span>
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px 0' }}>Embed your interactive Hi-Profile card on your personal website or blog.</p>

                <div style={{ background: '#0F172A', color: '#F8FAFC', borderRadius: 10, padding: 14, fontFamily: 'monospace', fontSize: 12, overflowX: 'auto', marginBottom: 12 }}>
                  {`<iframe src="${publicProfileUrl}" width="100%" height="600" frameborder="0" style="border-radius: 16px;"></iframe>`}
                </div>

                <button
                  onClick={() => copyToClipboard(`<iframe src="${publicProfileUrl}" width="100%" height="600" frameborder="0" style="border-radius: 16px;"></iframe>`, 'embed')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: copiedEmbed ? '#10B981' : '#F1F5F9', color: copiedEmbed ? '#FFFFFF' : '#334155', border: '1px solid #CBD5E1', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  {copiedEmbed ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedEmbed ? 'Embed Code Copied!' : 'Copy Embed Code'}</span>
                </button>
              </div>

            </div>
          )}

        </main>
      </div>

    </div>
  )
}

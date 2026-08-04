import { createContext, useContext, useState, useEffect } from 'react'

const OnboardingContext = createContext(null)

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback }
  catch { return fallback }
}

export function OnboardingProvider({ children }) {
  const [claimedUsername, setClaimedUsername] = useState(() => load('claimedUsername', ''))
  const [avatar, setAvatar] = useState(() => load('hiprofile_avatar', { type: null, data: null, transform: '', bg: '' }))
  const [profileName, setProfileName] = useState(() => load('profileName', ''))
  const [profileBio, setProfileBio]   = useState(() => load('profileBio', ''))
  const [socialLinks, setSocialLinks] = useState(() => load('socialLinks', {}))
  const [selectedTemplate, setSelectedTemplate] = useState(() => load('selectedTemplate', 'bento'))
  const [location, setLocation] = useState(() => load('location', 'San Francisco, CA'))
  const [expertise, setExpertise] = useState(() => load('expertise', [
    'Product Design', 'UI/UX', 'Design Systems', 'Figma', 'Prototyping', 'User Research', 'Motion Design'
  ]))
  const [workHistory, setWorkHistory] = useState(() => load('workHistory', [
    { company: 'Stripe', role: 'Senior Product Designer', period: '2022 - Present', desc: 'Leading design for payment infrastructure products.' },
    { company: 'Figma', role: 'Product Designer', period: '2020 - 2022', desc: 'Designed collaborative features and developer tools.' }
  ]))
  const [projects, setProjects] = useState(() => load('projects', [
    { title: 'Fintech Dashboard', desc: 'Complete redesign of a financial analytics platform', tags: ['UI/UX', 'Dashboard', 'Fintech'], type: 'work', image: '/assets/images/fintech_dashboard.png' },
    { title: 'E-commerce Mobile App', desc: 'End to end design for a luxury fashion brand', tags: ['Mobile', 'E-commerce', 'Luxury'], type: 'work', image: '/assets/images/ecommerce_app.png' },
    { title: 'Design System', desc: 'Comprehensive component library and design tokens', tags: ['System', 'Figma', 'Web'], type: 'work', image: '/assets/images/design_system.png' },
    { title: 'AR Glass Concept', desc: 'Speculative interface exploration for head-mounted displays', tags: ['Hardware', 'AR/VR', 'Future'], type: 'experiment', image: '/assets/images/ar_glass.png' }
  ]))

  // Appearance states
  const [theme, setTheme] = useState('light')
  const [accentColor, setAccentColor] = useState(() => load('hiprofile_accentColor', '#4F46E5'))
  const [fontSize, setFontSize] = useState(() => load('hiprofile_fontSize', 'medium'))
  const [profileCardFont, setProfileCardFont] = useState(() => load('hiprofile_profileCardFont', 'Inter'))

  useEffect(() => { localStorage.setItem('claimedUsername', JSON.stringify(claimedUsername)) }, [claimedUsername])
  useEffect(() => { localStorage.setItem('hiprofile_avatar', JSON.stringify(avatar)) }, [avatar])
  useEffect(() => { localStorage.setItem('profileName', JSON.stringify(profileName)) }, [profileName])
  useEffect(() => { localStorage.setItem('profileBio', JSON.stringify(profileBio)) }, [profileBio])
  useEffect(() => { localStorage.setItem('selectedTemplate', JSON.stringify(selectedTemplate)) }, [selectedTemplate])
  useEffect(() => { localStorage.setItem('socialLinks', JSON.stringify(socialLinks)) }, [socialLinks])
  useEffect(() => { localStorage.setItem('location', JSON.stringify(location)) }, [location])
  useEffect(() => { localStorage.setItem('expertise', JSON.stringify(expertise)) }, [expertise])
  useEffect(() => { localStorage.setItem('workHistory', JSON.stringify(workHistory)) }, [workHistory])
  useEffect(() => { localStorage.setItem('projects', JSON.stringify(projects)) }, [projects])

  // Save Appearance states to LocalStorage
  useEffect(() => { localStorage.setItem('hiprofile_accentColor', JSON.stringify(accentColor)) }, [accentColor])
  useEffect(() => { localStorage.setItem('hiprofile_fontSize', JSON.stringify(fontSize)) }, [fontSize])
  useEffect(() => { localStorage.setItem('hiprofile_profileCardFont', JSON.stringify(profileCardFont)) }, [profileCardFont])

  // Apply Theme and Accent Color CSS custom properties dynamically
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', accentColor)
    document.documentElement.style.setProperty('--color-primary-hover', accentColor)
  }, [accentColor])

  useEffect(() => {
    document.body.classList.remove('dark-mode')
    document.documentElement.setAttribute('data-theme', 'light')
  }, [])

  return (
    <OnboardingContext.Provider value={{
      claimedUsername, setClaimedUsername,
      avatar, setAvatar,
      profileName, setProfileName,
      profileBio, setProfileBio,
      socialLinks, setSocialLinks,
      selectedTemplate, setSelectedTemplate,
      location, setLocation,
      expertise, setExpertise,
      workHistory, setWorkHistory,
      projects, setProjects,
      theme, setTheme,
      accentColor, setAccentColor,
      fontSize, setFontSize,
      profileCardFont, setProfileCardFont,
    }}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider')
  return ctx
}


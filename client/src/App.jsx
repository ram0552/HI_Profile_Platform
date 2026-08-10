import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { OnboardingProvider } from './context/OnboardingContext'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Claim from './pages/Claim'
import Register from './pages/Register'
import Login from './pages/Login'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Upload from './pages/Upload'
import Profile from './pages/Profile'
import Setup from './pages/Setup'
import Select from './pages/Select'
import TimelineView from './pages/TimelineView'
import TimelineLive from './pages/TimelineLive'
import BentoView from './pages/BentoView'
import Dashboard from './pages/Dashboard'
import EditProfile from './pages/EditProfile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OnboardingProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/claim" element={<Claim />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/select" element={<Select />} />
            <Route path="/timeline" element={<TimelineView />} />
            <Route path="/timeline-live" element={<TimelineLive />} />
            <Route path="/bento" element={<BentoView />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/:username" element={<BentoView isPublic={true} />} />
          </Routes>
        </OnboardingProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

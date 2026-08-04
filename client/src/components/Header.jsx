import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`main-header${scrolled ? ' scrolled' : ''}`} id="header">
        <div className="header-container">
          <a href="#" className="logo-link" id="logo">
            <div className="logo-icon">
              <img src="/assets/images/logo.png" alt="hiprofile logo" className="logo-img" />
            </div>
            <span className="logo-text">hiprofile</span>
          </a>

          <nav className="nav-menu" id="navMenu">
            <a href="#features" className="nav-item">Features</a>
            <a href="#examples" className="nav-item">Examples</a>
            <a href="#pricing" className="nav-item">Pricing</a>
            <a href="#testimonials" className="nav-item">Blog</a>
          </nav>

          <div className="header-actions">
            <Link to="/login" className="btn-signin" id="btnSignIn">Sign in</Link>
            <a href="#cta-section" className="btn-primary" id="btnGetStartedHeader">Get started free</a>
            <button
              className="mobile-menu-toggle"
              id="menuToggle"
              aria-label="Toggle Menu"
              onClick={() => setMenuOpen(o => !o)}
            >
              <span className="bar" />
              <span className="bar" />
              <span className="bar" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={`mobile-drawer${menuOpen ? ' open' : ''}`} id="mobileDrawer">
        <nav className="mobile-nav">
          <a href="#features" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#examples" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Examples</a>
          <a href="#pricing" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#testimonials" className="mobile-nav-item" onClick={() => setMenuOpen(false)}>Blog</a>
          <hr className="drawer-divider" />
          <Link to="/login" className="mobile-btn-signin" onClick={() => setMenuOpen(false)}>Sign in</Link>
          <a href="#cta-section" className="mobile-btn-primary" onClick={() => setMenuOpen(false)}>Get started free</a>
        </nav>
      </div>
    </>
  )
}

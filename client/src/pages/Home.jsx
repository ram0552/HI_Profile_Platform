import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import Toast, { useToast } from '../components/Toast'
import { useOnboarding } from '../context/OnboardingContext'
import { getSocialIcon } from '../components/SocialIcons'

const renderLinkButtonContent = (label) => {
  let text = label;
  let icon = null;
  
  if (label.includes('Portfolio')) { icon = '💻'; }
  else if (label.includes('Dribbble')) { icon = getSocialIcon('dribbble', 16, 'currentColor'); text = 'Dribbble'; }
  else if (label.includes('LinkedIn')) { icon = getSocialIcon('linkedin', 16, 'currentColor'); text = 'LinkedIn'; }
  else if (label.includes('Twitter')) { icon = getSocialIcon('twitter', 16, 'currentColor'); text = 'Twitter'; }
  else if (label.includes('GitHub')) { icon = getSocialIcon('github', 16, 'currentColor'); text = 'GitHub'; }
  else if (label.includes('Instagram')) { icon = getSocialIcon('instagram', 16, 'currentColor'); text = 'Instagram'; }
  else if (label.includes('Blog')) { icon = '✍️'; }
  else if (label.includes('Resume')) { icon = '📄'; }
  else if (label.includes('Shop Prints')) { icon = '🖼️'; }
  else if (label.includes('Commissions')) { icon = '🎨'; }
  else if (label.includes('Products')) { icon = '🚀'; }
  else if (label.includes('Newsletter')) { icon = '✉️'; }
  else if (label.includes('Podcast')) { icon = '🎙️'; }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
      {icon} {text}
    </span>
  )
}

export default function Home() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const { setClaimedUsername } = useOnboarding()
  const [toastMsg, toastShow, toast] = useToast()
  const navigate = useNavigate()

  const handleClaim = (e) => {
    navigate('/claim')
  }



  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="hero-section" id="hero">
          <div className="hero-container">
            <div className="hero-badge">
              <span className="badge-icon">✦</span>
              <span className="badge-text">The personal page for makers &amp; creators</span>
            </div>
            <h1 className="hero-heading">
              <span className="heading-line">More than a Link-in-Bio.</span><br />
              <span className="gradient-text heading-line">Your Personal Webpage.</span>
            </h1>
            <p className="hero-subtitle">Create a beautiful personal page in minutes. Share who you are, what you do, and everything you love — all in one place.</p>
            {/* <form className="claim-form" onSubmit={handleClaim}>
              <div className="input-wrapper">
                <span className="input-prefix">hiprofile.bio/</span>
                <input
                  type="text"
                  placeholder="yourname"
                  aria-label="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-claim" id="btn-claim-landing"><span>Claim your profile</span><span className="arrow">→</span></button>
            </form> */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button
                type="button"
                className="btn-claim"
                id="btn-claim-landing"
                onClick={handleClaim}
              >
                <span>Claim your profile</span>
                <span className="arrow">→</span>
              </button>
            </div>
            <br />
            <p className="claim-meta">No credit card required · Free forever · Setup in 2 minutes</p>
            <div className="social-proof">
              <div className="avatar-group">
                <div className="proof-avatar" style={{backgroundColor:'#E2D3FF'}}>SC</div>
                <div className="proof-avatar" style={{backgroundColor:'#D1E4FF'}}>MJ</div>
                <div className="proof-avatar" style={{backgroundColor:'#FFD2D2'}}>YT</div>
                <div className="proof-avatar" style={{backgroundColor:'#D2F7E2'}}>AR</div>
              </div>
              <div className="rating-info">
                <div className="stars">★★★★★</div>
                <p className="rating-text">Loved by <strong>50,000+ creators</strong> worldwide</p>
              </div>
            </div>
          </div>
          <div className="stats-counter-strip">
            {[['50K+','Personal pages'],['120+','Countries'],['2 min','Average setup'],['99.9%','Uptime']].map(([n,l]) => (
              <div className="stat-box" key={l}><span className="stat-number">{n}</span><span className="stat-label">{l}</span></div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="features-section" id="features">
          <div className="section-header">
            <span className="section-label">FEATURES</span>
            <h2 className="section-title">Everything you need, <br /><span className="muted-text">nothing you don't.</span></h2>
            <p className="section-subtitle">Powerful features for serious creators, simple enough for everyone.</p>
          </div>
          <div className="features-grid">
            {[
              {icon:'🌐',color:'#8E51FF',bg:'rgba(142,81,255,0.1)',title:'Custom domain',text:"Connect your own domain name and make it truly yours."},
              {icon:'🎨',color:'#00BA9D',bg:'rgba(0,186,157,0.1)',title:'Beautiful themes',text:"Choose from dozens of stunning, professionally designed themes."},
              {icon:'📊',color:'#0070F3',bg:'rgba(0,112,243,0.1)',title:'Built-in analytics',text:"Understand your audience with privacy-friendly analytics."},
              {icon:'⚡',color:'#FF9F00',bg:'rgba(255,159,0,0.1)',title:'Blazing fast',text:"Pages load in under 200ms globally, powered by edge infrastructure."},
              {icon:'🔗',color:'#FF3366',bg:'rgba(255,51,102,0.1)',title:'Link everything',text:"Add links to all your social profiles, projects, work, podcasts — anything."},
              {icon:'🛡️',color:'#7952B3',bg:'rgba(121,82,179,0.1)',title:'Privacy first',text:"No trackers, no ads, no selling your data."},
              {icon:'📱',color:'#555555',bg:'rgba(85,85,85,0.1)',title:'Mobile optimized',text:"Your page looks gorgeous on every screen."},
              {icon:'🤖',color:'#A100C7',bg:'rgba(161,0,199,0.1)',title:'AI-powered bio',text:"Our AI will write a compelling bio that captures who you are perfectly."},
            ].map(f => (
              <div className="feature-card" key={f.title}>
                <div className="feature-icon-wrapper" style={{color:f.color,background:f.bg}}>{f.icon}</div>
                <h3 className="feature-card-title">{f.title}</h3>
                <p className="feature-card-text">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section className="examples-section" id="examples">
          <div className="section-header">
            <span className="section-label">EXAMPLES</span>
            <h2 className="section-title">Pages made by real people</h2>
            <p className="section-subtitle">Designers, developers, creators, and makers — all with beautiful hiprofiles.</p>
          </div>
          <div className="examples-grid">
            <div className="example-card theme-purple">
              <div className="browser-dots"><div className="dots-group"><span className="dot"/><span className="dot"/><span className="dot"/></div><span className="browser-address">hiprofile.bio/sarahchen</span></div>
              <div className="profile-preview-card">
                <div className="profile-avatar-wrapper"><img src="/assets/images/sarah.jpeg" alt="Sarah Chen" className="profile-avatar-img" /></div>
                <h3 className="profile-name">Sarah Chen</h3>
                <p className="profile-title">Product Designer at Figma</p>
                <p className="profile-bio">Designing the future of collaborative tools.</p>
                <div className="profile-links">
                  {['💻 Portfolio','🏀 Dribbble','💼 LinkedIn','🐦 Twitter'].map(l=><a href="#" className="profile-link-btn" key={l}>{renderLinkButtonContent(l)}</a>)}
                </div>
              </div>
            </div>
            <div className="example-card theme-blue">
              <div className="browser-dots"><div className="dots-group"><span className="dot"/><span className="dot"/><span className="dot"/></div><span className="browser-address">hiprofile.bio/marcusj</span></div>
              <div className="profile-preview-card">
                <div className="profile-avatar-text" style={{backgroundColor:'#D1E4FF',color:'#0070F3'}}>MJ</div>
                <h3 className="profile-name">Marcus Johnson</h3>
                <p className="profile-title">Full-Stack Developer &amp; Open Source</p>
                <p className="profile-bio">Building tools for developers. Creator of 12 open source projects.</p>
                <div className="profile-links">
                  {['🐙 GitHub','✍️ Blog','🐦 Twitter','📄 Resume'].map(l=><a href="#" className="profile-link-btn" key={l}>{renderLinkButtonContent(l)}</a>)}
                </div>
              </div>
            </div>
            <div className="example-card theme-red">
              <div className="browser-dots"><div className="dots-group"><span className="dot"/><span className="dot"/><span className="dot"/></div><span className="browser-address">hiprofile.bio/yukitanaka</span></div>
              <div className="profile-preview-card">
                <div className="profile-avatar-text" style={{backgroundColor:'#FFD2D2',color:'#E01E5A'}}>YT</div>
                <h3 className="profile-name">Yuki Tanaka</h3>
                <p className="profile-title">Photographer &amp; Visual Artist</p>
                <p className="profile-bio">Capturing life's fleeting moments. Based in Tokyo.</p>
                <div className="profile-links">
                  {['📸 Instagram','🖼️ Shop Prints','🎨 Commissions'].map(l=><a href="#" className="profile-link-btn" key={l}>{renderLinkButtonContent(l)}</a>)}
                </div>
              </div>
            </div>
            <div className="example-card theme-green">
              <div className="browser-dots"><div className="dots-group"><span className="dot"/><span className="dot"/><span className="dot"/></div><span className="browser-address">hiprofile.bio/alexrivera</span></div>
              <div className="profile-preview-card">
                <div className="profile-avatar-text" style={{backgroundColor:'#D2F7E2',color:'#00BA9D'}}>AR</div>
                <h3 className="profile-name">Alex Rivera</h3>
                <p className="profile-title">Indie Maker &amp; Entrepreneur</p>
                <p className="profile-bio">Built 7 products. 3 profitable. Sharing the journey.</p>
                <div className="profile-links">
                  {['🚀 Products','✉️ Newsletter','🐦 Twitter','🎙️ Podcast'].map(l=><a href="#" className="profile-link-btn" key={l}>{renderLinkButtonContent(l)}</a>)}
                </div>
              </div>
            </div>
          </div>
          <div className="examples-footer">
            <a href="#cta-section" className="btn-outline"><span className="btn-icon">📁</span><span>Browse more examples</span></a>
          </div>
        </section>

        {/* Pricing */}
        <section className="pricing-section" id="pricing">
          <div className="section-header">
            <span className="section-label">PRICING</span>
            <h2 className="section-title">Simple, honest pricing</h2>
            <p className="section-subtitle">Start free, upgrade when you're ready.</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <span className="plan-badge">FREE</span>
              <div className="plan-price-wrapper"><span className="plan-price">Free</span></div>
              <p className="plan-desc">Perfect for getting started.</p>
              <a href="#cta-section" className="btn-plan-outline">Get started</a>
              <hr className="plan-divider" />
              <ul className="plan-features">
                {['hiprofile/yourname URL','Choose from 5 themes','Up to 10 links','Basic analytics','Mobile optimized','SSL certificate'].map(f=><li key={f}><span className="check">✓</span> {f}</li>)}
              </ul>
            </div>
            <div className="pricing-card featured">
              <span className="featured-ribbon">MOST POPULAR</span>
              <span className="plan-badge">PRO</span>
              <div className="plan-price-wrapper"><span className="currency">$</span><span className="plan-price">6</span><span className="period">/mo</span></div>
              <p className="plan-desc">For creators who want more power.</p>
              <a href="#cta-section" className="btn-plan-primary">Start free trial</a>
              <hr className="plan-divider" />
              <ul className="plan-features">
                {['Custom domain','All 40+ themes','Unlimited links','Advanced analytics','Priority support','Remove branding','Email capture'].map(f=><li key={f}><span className="check">✓</span> {f}</li>)}
              </ul>
            </div>
            <div className="pricing-card">
              <span className="plan-badge">BUSINESS</span>
              <div className="plan-price-wrapper"><span className="currency">$</span><span className="plan-price">18</span><span className="period">/mo</span></div>
              <p className="plan-desc">For teams and professionals.</p>
              <a href="#cta-section" className="btn-plan-outline">Choose Business</a>
              <hr className="plan-divider" />
              <ul className="plan-features">
                {['Everything in Pro','Team collaboration','Multiple pages','White-label solution','API access','Priority phone support'].map(f=><li key={f}><span className="check">✓</span> {f}</li>)}
              </ul>
            </div>
          </div>
          <p className="pricing-footer">All plans include a 14-day free trial. <a href="#cta-section">Compare all features →</a></p>
        </section>

        {/* Testimonials */}
        <section className="testimonials-section" id="testimonials">
          <div className="section-header">
            <span className="section-label">TESTIMONIALS</span>
            <h2 className="section-title">Loved by creators worldwide</h2>
          </div>
          <div className="testimonials-grid">
            {[
              {stars:'★★★★★',quote:'"hiprofile is the cleanest way to share everything about yourself online. I replaced 5 different links in my bio with just one."',avatar:<img src="/assets/images/sarah.jpeg" alt="Sarah" className="author-avatar"/>,name:'Sarah Chen',title:'Product Designer, Figma'},
              {stars:'★★★★★',quote:'"I\'ve tried every link-in-bio tool out there. hiprofile is on another level — the analytics alone are worth it."',avatar:<div className="author-avatar-text" style={{backgroundColor:'#D1E4FF',color:'#0070F3'}}>MJ</div>,name:'Marcus Johnson',title:'Developer & Open Source Creator'},
              {stars:'★★★★★',quote:'"Setting up my page took literally 4 minutes. Now it\'s the link I share everywhere."',avatar:<div className="author-avatar-text" style={{backgroundColor:'#FFD2D2',color:'#E01E5A'}}>YT</div>,name:'Yuki Tanaka',title:'Photographer & Artist'},
              {stars:'★★★★★',quote:'"The custom domain feature alone is worth the Pro upgrade. Having myname.com point to my hiprofile is so clean."',avatar:<div className="author-avatar-text" style={{backgroundColor:'#D2F7E2',color:'#00BA9D'}}>AR</div>,name:'Alex Rivera',title:'Indie Maker'},
            ].map(t => (
              <div className="testimonial-card" key={t.name}>
                <div className="stars">{t.stars}</div>
                <p className="testimonial-quote">{t.quote}</p>
                <div className="testimonial-author">{t.avatar}<div><strong className="author-name">{t.name}</strong><span className="author-title">{t.title}</span></div></div>
              </div>
            ))}
          </div>
        </section>
        
        <section className="cta-section" id="cta-section">
          <div className="cta-card">
            <div className="cta-badge"><span className="badge-dot"/><span>Join 50,000+ creators today</span></div>
            <h2 className="cta-title">Your page is waiting for you.</h2>
            <p className="cta-subtitle">Create your personal page in minutes. It's free forever.</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                            <button type="submit" className="btn-cta" onClick={handleClaim}><span>Get started free</span><span className="arrow">→</span></button>
              </div>
              <br />
            <p className="cta-meta">Free forever · No credit card · Setup in 2 min</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-grid">
          <div className="footer-info">
            <a href="#" className="logo-link"><div className="logo-icon"><img src="/assets/images/logo.png" alt="hiprofile logo" className="logo-img" /></div><span className="logo-text">hiprofile</span></a>
            <p className="footer-desc">The personal page for makers, creators, and curious minds.</p>
            <div className="social-links" style={{ display: 'flex', gap: 12 }}>
              <a href="#" className="social-icon" aria-label="Twitter" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {getSocialIcon('twitter', 20, '#64748B')}
              </a>
              <a href="#" className="social-icon" aria-label="GitHub" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {getSocialIcon('github', 20, '#64748B')}
              </a>
              <a href="#" className="social-icon" aria-label="Instagram" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {getSocialIcon('instagram', 20, '#64748B')}
              </a>
              <a href="#" className="social-icon" aria-label="LinkedIn" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {getSocialIcon('linkedin', 20, '#64748B')}
              </a>
            </div>
          </div>
          {[['PRODUCT',['Features','Pricing','Examples','Changelog','Roadmap']],['COMPANY',['About','Blog','Careers','Press']],['RESOURCES',['Documentation','Help Center','Community','API']],['LEGAL',['Privacy Policy','Terms of Service','Cookie Policy','GDPR']]].map(([h,links])=>(
            <div className="footer-column" key={h}><h4>{h}</h4>{links.map(l=><a href="#" key={l}>{l}</a>)}</div>
          ))}
        </div>
        <hr className="footer-divider" />
        <div className="footer-bottom">
          <p className="copyright">© 2024 hiprofile. All rights reserved.</p>
          <div className="footer-bottom-links"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookies</a></div>
          <div className="status-indicator"><span className="status-dot"/><span>All systems operational</span></div>
        </div>
      </footer>

      <Toast message={toastMsg} show={toastShow} />
    </>
  )
}

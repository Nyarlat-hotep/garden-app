import { Sprout, Map, ClipboardList, Bell } from 'lucide-react'
import './LandingPage.css'

export default function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-logo">🌱</div>
        <nav className="landing-nav">
          <button className="nav-cta" onClick={onGetStarted}>Sign In</button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero">
          <h1>Your Garden, Simplified</h1>
          <p className="hero-sub">
            Track plants, log care activities, and visualize your garden layout—all in one place.
          </p>
          <button className="hero-cta" onClick={onGetStarted}>
            Get Started Free
          </button>
          <p className="hero-note">No credit card required</p>
        </section>

        <section className="features">
          <div className="feature">
            <div className="feature-icon"><Map size={28} /></div>
            <h2>Visual Garden Map</h2>
            <p>Paint your garden layout on a grid, drag plants around, and see your entire growing space at a glance.</p>
          </div>

          <div className="feature">
            <div className="feature-icon"><Sprout size={28} /></div>
            <h2>Plant Tracking</h2>
            <p>Add plants from a curated list of 100+ food crops. Track varieties, families, and days to harvest.</p>
          </div>

          <div className="feature">
            <div className="feature-icon"><ClipboardList size={28} /></div>
            <h2>Activity Logging</h2>
            <p>Log watering, pruning, fertilizing, and harvesting. See your care history and stay on top of schedules.</p>
          </div>

          <div className="feature">
            <div className="feature-icon"><Bell size={28} /></div>
            <h2>Smart Notifications</h2>
            <p>Get reminded when plants need care. Browser push notifications keep you on track even when you're away.</p>
          </div>
        </section>

        <section className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <span className="step-num">1</span>
              <h3>Create your account</h3>
              <p>Sign up in seconds. Your data is stored securely and privately.</p>
            </div>
            <div className="step">
              <span className="step-num">2</span>
              <h3>Add your plants</h3>
              <p>Choose from 100+ pre-loaded food plants or discover new varieties.</p>
            </div>
            <div className="step">
              <span className="step-num">3</span>
              <h3>Map your garden</h3>
              <p>Paint your garden layout on the grid and arrange plants visually.</p>
            </div>
            <div className="step">
              <span className="step-num">4</span>
              <h3>Log activities</h3>
              <p>Track every watering, pruning, and harvest. Never forget a care task.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>Built with care for home gardeners everywhere.</p>
      </footer>
    </div>
  )
}

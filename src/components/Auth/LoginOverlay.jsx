import { useState } from 'react'
import './LoginOverlay.css'

export default function LoginOverlay({ onLogin, onSignup, onBack }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await onLogin(email, password)
      } else {
        await onSignup(email, password)
      }
    } catch (err) {
      setError(err.message || (isLogin ? 'Login failed' : 'Sign up failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-overlay">
      <div className="login-box">
        <button className="login-back" onClick={onBack} aria-label="Back to home">
          ← Back
        </button>
        <div className="login-icon">🌱</div>
        <h1 className="login-title">Garden</h1>
        <p className="login-sub">Your personal growing companion</p>

        <div className="login-tabs">
          <button
            className={`login-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Sign In
          </button>
          <button
            className={`login-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create account')}
          </button>
        </form>
      </div>
    </div>
  )
}

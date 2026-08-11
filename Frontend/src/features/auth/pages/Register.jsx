import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { User, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Loader from '../../../components/Loader/Loader'
import './login.scss'

const Register = () => {
  const { handleRegister, loading } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    try {
      await handleRegister({ username, email, password })
      navigate('/')
    } catch (error) {
      console.error('Registration failed', error)
      setErrorMessage(error?.response?.data?.message || error?.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <main className="auth-shell">
      {/* Left Column: Architectural Editorial Brand Section */}
      <section className="auth-story" aria-label="SkillBridge AI">
        <div className="brand-top">
          <div className="auth-mark">SB</div>
          <span className="auth-kicker">SkillBridge AI</span>
        </div>

        <div className="story-body">
          <h1 className="hero-headline">
            Turn interview prep into a repeatable system.
          </h1>
          <p className="hero-copy">
            Create reports, revisit feedback, and keep your practice history organized from the first session.
          </p>
        </div>
      </section>

      {/* Right Column: Architectural Auth Panel */}
      <section className="auth-panel" aria-labelledby="register-title">
        <div className="auth-card">
          <header className="panel-header">
            <span className="panel-kicker">New account</span>
            <h2 id="register-title">Create your workspace</h2>
            <p>Set up your account and start your first interview report.</p>
          </header>

          {errorMessage && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={16} className="error-icon" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="username">Username</label>
              <div className="input-wrapper">
                <User className="input-icon" size={16} />
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Choose a username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={16} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={16} />
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              className="btn-submit"
              type="submit"
              disabled={loading}
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              {!loading && <ArrowRight size={16} className="btn-icon" />}
            </button>

            <div className="form-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>

      {loading && (
        <div className="loading-overlay" aria-live="polite">
          <Loader text="Creating your account..." />
        </div>
      )}
    </main>
  )
}

export default Register

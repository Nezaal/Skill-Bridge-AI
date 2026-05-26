import React, { useState } from 'react'
import "./login.scss"
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

import Loader from '../../../components/Loader/Loader'

const Register = () => {
  const { handleRegister, loading } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await handleRegister({ username, email, password })
      // move to home after registration
      navigate("/")
    } catch (error) {
      console.error("Registration failed", error)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="SkillBridge AI">
        <div className="auth-mark">SB</div>
        <div>
          <p className="auth-kicker">SkillBridge AI</p>
          <h1>Turn interview prep into a repeatable system.</h1>
          <p className="auth-copy">
            Create reports, revisit feedback, and keep your practice history organized from the first session.
          </p>
        </div>
      </section>

      <section className="auth-panel" aria-labelledby="register-title">
        <div className="brand-header">
          <p className="auth-kicker">New account</p>
          <h2 id="register-title">Create your workspace</h2>
          <p>Set up your account and start your first interview report.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Choose a username"
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="name@example.com"
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Create a password"
                autoComplete="new-password"
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
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          <div className="form-footer">
            <p>Already have an account? <Link to={'/login'}>Sign in</Link></p>
          </div>
        </form>
      </section>

      {loading && (
        <div className="loading-overlay">
          <Loader text="Creating your account..." />
        </div>
      )}
    </main>
  )
}

export default Register

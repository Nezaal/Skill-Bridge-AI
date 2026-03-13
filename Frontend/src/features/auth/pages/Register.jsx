import React, { useState } from 'react'
import "./login.scss"
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

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
  if(loading){
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
        <p>Creating your account...</p>
      </div>
    )
  }

  return (
    <main className="login-wrapper">
      {/* Ambient Animated Orbs */}
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      <div className="login-glass-card">

        <div className="brand-header">
          <div className="brand-logo"></div>
          <h1>Create Account</h1>
          <p>Enter your details below to get started</p>
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
      </div>

      {/* Optional full-screen loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Creating your account...</p>
        </div>
      )}
    </main>
  )
}

export default Register
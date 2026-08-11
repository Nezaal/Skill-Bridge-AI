import React, { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { Link, useNavigate } from 'react-router'
import { 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    ArrowRight, 
    AlertCircle
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Loader from '../../../components/Loader/Loader'
import './login.scss'

const Login = () => {
    const { handleLogin, handleGoogleLogin, handleGithubLogin, loading } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMessage('')
        
        try {
            await handleLogin({ email, password })
            navigate('/')
        } catch (error) {
            console.error('Login failed', error)
            setErrorMessage(error?.response?.data?.message || error?.message || 'Invalid email or password. Please try again.')
        }
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        setErrorMessage('')
        try {
            await handleGoogleLogin({ credential: credentialResponse.credential })
            navigate('/')
        } catch (error) {
            console.error('Google login failed', error)
            setErrorMessage('Google sign-in failed. Please try again.')
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
                        Interview practice that feels like focused work.
                    </h1>
                    <p className="hero-copy">
                        Build sharper responses, target your knowledge gaps, and review real-time feedback in one structured workspace.
                    </p>
                </div>
            </section>

            {/* Right Column: Architectural Auth Panel */}
            <section className="auth-panel" aria-labelledby="login-title">
                <div className="auth-card">
                    <header className="panel-header">
                        <span className="panel-kicker">Welcome back</span>
                        <h2 id="login-title">Sign in to continue</h2>
                        <p>Access your interview workspace and active scorecards.</p>
                    </header>

                    {errorMessage && (
                        <div className="auth-error-banner" role="alert">
                            <AlertCircle size={16} className="error-icon" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-wrapper">
                                <Mail className="input-icon" size={16} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="name@example.com"
                                    autoComplete="username"
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
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle-btn"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn-submit"
                            type="submit"
                            disabled={loading}
                        >
                            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                            {!loading && <ArrowRight size={16} className="btn-icon" />}
                        </button>

                        <div className="divider">
                            <span>or continue with</span>
                        </div>

                        <div className="social-actions">
                            <div className="google-btn-wrapper">
                                <GoogleLogin
                                    width="100%"
                                    theme="filled_black"
                                    shape="square"
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => {
                                        setErrorMessage('Google sign-in failed. Please try again.')
                                    }}
                                />
                            </div>

                            <button
                                className="btn-github"
                                type="button"
                                onClick={handleGithubLogin}
                                disabled={loading}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                </svg>
                                <span>Continue with GitHub</span>
                            </button>
                        </div>

                        <div className="form-footer">
                            <p>
                                Don't have an account?{' '}
                                <Link to="/register" className="auth-link">
                                    Register now
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </section>

            {loading && (
                <div className="loading-overlay" aria-live="polite">
                    <Loader text="Authenticating..." />
                </div>
            )}
        </main>
    )
}

export default Login

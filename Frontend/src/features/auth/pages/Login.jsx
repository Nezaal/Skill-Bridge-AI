import React, { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google';
import "./login.scss"
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

import Loader from '../../../components/Loader/Loader'

const Login = () => {
    const { handleLogin, handleGoogleLogin, handleGithubLogin, loading } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        // Here we handle the login, and wait for it to complete. 
        // If the hook throws an error, it will bypass navigation.
        try {
            await handleLogin({ email, password })
            navigate("/")
        } catch (error) {
            console.error("Login failed", error)
        }
    }

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            await handleGoogleLogin({ credential: credentialResponse.credential })
            navigate("/")
        } catch (error) {
            console.error("Google login failed", error)
        }
    }

    return (
        <main className="auth-shell">
            <section className="auth-story" aria-label="SkillBridge AI">
                <div className="auth-mark">SB</div>
                <div>
                    <p className="auth-kicker">SkillBridge AI</p>
                    <h1>Interview practice that feels like focused work.</h1>
                    <p className="auth-copy">
                        Build sharper answers, review your gaps, and keep every report in one quiet workspace.
                    </p>
                </div>
            </section>

            <section className="auth-panel" aria-labelledby="login-title">
                <div className="brand-header">
                    <p className="auth-kicker">Welcome back</p>
                    <h2 id="login-title">Sign in to continue</h2>
                    <p>Use your account to open your interview workspace.</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email Address</label>
                        <div className="input-wrapper">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="name@example.com"
                                autoComplete="username"
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
                                placeholder="Enter your password"
                                autoComplete="current-password"
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
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>

                    <div className="divider">
                        <span>or continue with</span>
                    </div>

                    <div className="google-btn-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => {
                                console.log('Login Failed');
                            }}
                        />
                    </div>

                    <button
                        className="btn-github"
                        type="button"
                        onClick={handleGithubLogin}
                        disabled={loading}
                    >
                        Continue with GitHub
                    </button>

                    <div className="form-footer">
                        <p>Don't have an account? <Link to={'/register'}>Register now</Link></p>
                    </div>
                </form>
            </section>

            {loading && (
                <div className="loading-overlay">
                    <Loader text="Authenticating..." />
                </div>
            )}
        </main>
    )
}

export default Login

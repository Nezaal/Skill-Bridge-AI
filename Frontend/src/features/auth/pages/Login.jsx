import React, { useState } from 'react'
import "./login.scss"
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'

import Loader from '../../../components/Loader/Loader'

const Login = () => {
    const { handleLogin, loading } = useAuth()
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

    return (
        <main className="login-wrapper">
            {/* Ambient Animated Orbs */}
            <div className="ambient-orb orb-1"></div>
            <div className="ambient-orb orb-2"></div>

            <div className="login-glass-card">
                
                <div className="brand-header">
                    <div className="brand-logo"></div>
                    <h1>Welcome Back</h1>
                    <p>Enter your credentials to access your account</p>
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

                    <div className="form-footer">
                        <p>Don't have an account? <Link to={'/register'}>Register now</Link></p>
                    </div>
                </form>
            </div>

            {/* Optional full-screen loading overlay */}
            {loading && (
                <div className="loading-overlay">
                    <Loader text="Authenticating..." />
                </div>
            )}
        </main>
    )
}

export default Login
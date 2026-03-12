import React, { useState } from 'react'
import "./auth.form.scss"
import { Link } from 'react-router'
import { useAuth } from '../hooks/useAuth'



const Login = () => {

    const { handleLogin, loading } = useAuth()

    const [email , setEmail] = useState("")

    const [password , setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault();
        await handleLogin({email, password})
    }

    if(loading){
        return (
            <main> <h1>Loading...</h1></main>
        )
    }

    return (
        <main>
            <div className='form-container'>

                <h1>Login</h1>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input type="email" id='email'
                            onChange={(e) => {setEmail(e.target.value)}}
                            name='email' placeholder='Enter your email' />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" 
                        onChange={(e) => {setPassword(e.target.value)}}
                        id='password' name='password' placeholder='Enter your password' />
                    </div>

                    <button
                        className='button primary-button' type='submit'>Login
                    </button>

                    <p>Don't have an account?
                        <Link to={'/register'}>Register</Link>
                    </p>

                </form>
            </div>
        </main>
    )
}

export default Login
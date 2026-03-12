import React from 'react'
import { Link } from 'react-router'
import { useNavigate } from 'react-router'

const Register = () => {

  const navigate = useNavigate()

  const handleSubmit = (e) => {
    handleSubmit(e)
  }
  return (
    <main>
      <div className='form-container'>

        <h1>Register</h1>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input type="username" id='username'
              name='username' placeholder='Enter your username' />
          </div>
          <div className="input-group">
            <label htmlFor="email">email</label>
            <input type="email" id='email'
              name='email' placeholder='Enter your email' />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input type="password" id='password' name='password' placeholder='Enter your password' />
          </div>

          <button
            className='button primary-button' type='submit'>Register
          </button>

        </form>

        <p>Already have an account?
          <Link to={'/login'}>login</Link>
        </p>
      </div>
    </main>
  )
}

export default Register
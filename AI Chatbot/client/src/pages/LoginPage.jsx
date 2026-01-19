import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(credentials.username, credentials.password)
      
      if (result.success) {
        toast.success('Login successful!')
        navigate('/dashboard')
      } else {
        toast.error(result.message || 'Login failed')
      }
    } catch (error) {
      toast.error('An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '50px auto' }}>
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ color: '#667eea', marginBottom: '8px' }}>🔐 Admin Login</h1>
            <p style={{ color: '#666' }}>Access the dashboard to manage competition data</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                className="input"
                placeholder="Enter your username"
                required
                disabled={loading}
              />
            </div>
            
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={credentials.password}
                onChange={handleChange}
                className="input"
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                  Logging in...
                </div>
              ) : (
                'Login'
              )}
            </button>
          </form>
          
          <div style={{ marginTop: '30px', padding: '16px', background: '#fff3cd', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '8px', color: '#856404' }}>🔑 Demo Credentials:</h4>
            <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
              <strong>Username:</strong> admin<br/>
              <strong>Password:</strong> admin123
            </p>
          </div>
          
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button 
              onClick={() => navigate('/chat')} 
              className="btn btn-secondary"
            >
              ← Back to Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
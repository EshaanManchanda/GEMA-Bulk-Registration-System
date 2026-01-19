import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="logo">
          🤖 GEMA AI Chatbot
        </Link>
        
        <div className="nav-links">
          <Link to="/chat">Chat</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <span>Welcome, {user?.username}</span>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Admin Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
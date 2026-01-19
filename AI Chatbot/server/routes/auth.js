const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Username and password are required' 
      })
    }

    // Find user
    const user = await User.findOne({ 
      username: username.toLowerCase(),
      isActive: true 
    })

    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      })
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid credentials' 
      })
    }

    // Update login info
    await user.updateLoginInfo()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: user.safeInfo
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ 
      message: 'Internal server error' 
    })
  }
})

// Verify token route
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'User not found or inactive' 
      })
    }

    res.json({
      message: 'Token is valid',
      user: user.safeInfo
    })

  } catch (error) {
    console.error('Token verification error:', error)
    res.status(500).json({ 
      message: 'Internal server error' 
    })
  }
})

// Change password route
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: 'Current password and new password are required' 
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'New password must be at least 6 characters long' 
      })
    }

    // Find user
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      })
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword)
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ 
        message: 'Current password is incorrect' 
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ 
      message: 'Internal server error' 
    })
  }
})

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password')
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found' 
      })
    }

    res.json(user.safeInfo)

  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ 
      message: 'Internal server error' 
    })
  }
})

// Logout route (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  // In a stateless JWT system, logout is handled client-side
  // by removing the token from storage
  res.json({ 
    message: 'Logout successful' 
  })
})

// Initialize default admin user
router.post('/init', async (req, res) => {
  try {
    // Only allow this in development or if no admin exists
    const adminExists = await User.findOne({ role: 'admin' })
    
    if (adminExists && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ 
        message: 'Admin user already exists' 
      })
    }

    const admin = await User.createDefaultAdmin()
    
    res.json({
      message: 'Default admin user initialized',
      username: admin.username
    })

  } catch (error) {
    console.error('Init admin error:', error)
    res.status(500).json({ 
      message: 'Internal server error' 
    })
  }
})

module.exports = router
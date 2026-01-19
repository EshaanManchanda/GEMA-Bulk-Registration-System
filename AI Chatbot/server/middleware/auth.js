const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token is required' 
      })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password')
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        message: 'User not found or inactive' 
      })
    }

    // Add user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      permissions: user.permissions
    }

    next()

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token' 
      })
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token has expired' 
      })
    }

    console.error('Auth middleware error:', error)
    return res.status(500).json({ 
      message: 'Internal server error' 
    })
  }
}

// Middleware to check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required' 
      })
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ 
        message: `Permission '${permission}' is required` 
      })
    }

    next()
  }
}

// Middleware to check if user has admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required' 
    })
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Admin access required' 
    })
  }

  next()
}

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(decoded.userId).select('-password')
      
      if (user && user.isActive) {
        req.user = {
          userId: decoded.userId,
          username: decoded.username,
          role: decoded.role,
          permissions: user.permissions
        }
      }
    }

    next()

  } catch (error) {
    // Continue without authentication if token is invalid
    next()
  }
}

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (req, res, next) => {
  // This could be enhanced with Redis for distributed rate limiting
  // For now, we'll use a simple in-memory approach
  const key = `${req.ip}-${req.user?.userId || 'anonymous'}`
  
  // In production, implement proper rate limiting
  next()
}

module.exports = {
  authenticateToken,
  requirePermission,
  requireAdmin,
  optionalAuth,
  sensitiveOperationLimit
}
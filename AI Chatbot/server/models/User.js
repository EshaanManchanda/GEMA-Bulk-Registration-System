const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'moderator'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginCount: {
    type: Number,
    default: 0
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'manage_users', 'view_analytics']
  }]
}, {
  timestamps: true
})

// Index for performance

userSchema.index({ email: 1 })
userSchema.index({ isActive: 1 })

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next()
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12)
    this.password = hashedPassword
    next()
  } catch (error) {
    next(error)
  }
})

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw error
  }
}

// Instance method to update login info
userSchema.methods.updateLoginInfo = async function() {
  this.lastLogin = new Date()
  this.loginCount += 1
  return await this.save()
}

// Static method to create default admin user
userSchema.statics.createDefaultAdmin = async function() {
  const adminExists = await this.findOne({ username: 'admin' })
  
  if (!adminExists) {
    const defaultAdmin = new this({
      username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      email: 'admin@gema.com',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'manage_users', 'view_analytics']
    })
    
    await defaultAdmin.save()
    console.log('✅ Default admin user created')
    return defaultAdmin
  }
  
  return adminExists
}

// Virtual for user info without password
userSchema.virtual('safeInfo').get(function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    role: this.role,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    loginCount: this.loginCount,
    permissions: this.permissions,
    createdAt: this.createdAt
  }
})

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password
    return ret
  }
})

module.exports = mongoose.model('User', userSchema)
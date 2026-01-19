const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  data: {
    certificateUrl: String,
    paymentLink: String,
    examDates: String,
    websiteInfo: Object,
    intent: String,
    confidence: Number
  }
})

const chatSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true
  },
  messages: [messageSchema],
  userInfo: {
    email: String,
    ipAddress: String,
    userAgent: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  totalMessages: {
    type: Number,
    default: 0
  },
  certificatesRequested: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
})

// Pre-save middleware to update counters
chatSchema.pre('save', function(next) {
  this.totalMessages = this.messages.length
  this.certificatesRequested = this.messages.filter(msg => 
    msg.data && msg.data.certificateUrl
  ).length
  this.lastActivity = new Date()
  next()
})

// Index for performance
chatSchema.index({ sessionId: 1 })
chatSchema.index({ createdAt: -1 })
chatSchema.index({ isActive: 1 })
chatSchema.index({ lastActivity: -1 })

// Static method to create or update chat session
chatSchema.statics.addMessage = async function(sessionId, messageData, userInfo = {}) {
  let chat = await this.findOne({ sessionId })
  
  if (!chat) {
    chat = new this({
      sessionId,
      messages: [],
      userInfo
    })
  }
  
  chat.messages.push(messageData)
  chat.userInfo = { ...chat.userInfo, ...userInfo }
  
  return await chat.save()
}

// Static method to get chat statistics
chatSchema.statics.getStats = async function() {
  const totalChats = await this.countDocuments()
  const activeChats = await this.countDocuments({ isActive: true })
  const totalMessages = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$totalMessages' } } }
  ])
  const totalCertificates = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$certificatesRequested' } } }
  ])
  
  return {
    totalChats,
    activeChats,
    totalMessages: totalMessages[0]?.total || 0,
    totalCertificates: totalCertificates[0]?.total || 0
  }
}

// Method to get conversation summary
chatSchema.methods.getSummary = function() {
  const lastMessage = this.messages[this.messages.length - 1]
  return {
    sessionId: this.sessionId,
    totalMessages: this.totalMessages,
    certificatesRequested: this.certificatesRequested,
    lastActivity: this.lastActivity,
    lastMessage: lastMessage ? {
      text: lastMessage.text.substring(0, 100) + '...',
      sender: lastMessage.sender,
      timestamp: lastMessage.timestamp
    } : null
  }
}

module.exports = mongoose.model('Chat', chatSchema)
const mongoose = require('mongoose');

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
  response_time: {
    type: Number, // milliseconds
    default: 0
  },
  sentiment_score: {
    type: Number, // -1 to 1
    default: 0
  },
  feedback: {
    rating: {
      type: String,
      enum: ['helpful', 'not_helpful', null],
      default: null
    },
    comment: String,
    timestamp: Date
  },
  data: {
    intent: String,
    confidence: Number,
    event_id: mongoose.Schema.Types.ObjectId,
    certificate_url: String,
    payment_link: String,
    event_info: Object,
    faq_id: mongoose.Schema.Types.ObjectId
  }
});

const chatSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'user_type'
  },
  user_type: {
    type: String,
    enum: ['School', 'Admin', 'anonymous'],
    default: 'anonymous'
  },
  messages: [messageSchema],
  event_context: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  location: {
    type: String,
    enum: ['india', 'international', 'global'],
    default: 'global'
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_activity: {
    type: Date,
    default: Date.now,
    index: true
  },
  total_messages: {
    type: Number,
    default: 0
  },
  certificates_requested: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  language: {
    type: String,
    default: 'en'
  },
  resolved: {
    type: Boolean,
    default: false
  },
  satisfaction_score: {
    type: Number, // 1-5 or null
    default: null
  },
  average_response_time: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ createdAt: -1 });
chatSchema.index({ is_active: 1 });
chatSchema.index({ user_id: 1, user_type: 1 });

// Pre-save middleware
chatSchema.pre('save', function (next) {
  this.total_messages = this.messages.length;
  this.certificates_requested = this.messages.filter(msg =>
    msg.data && msg.data.certificate_url
  ).length;
  this.last_activity = new Date();

  // Calculate average response time
  const botMessages = this.messages.filter(msg => msg.sender === 'bot' && msg.response_time > 0);
  if (botMessages.length > 0) {
    const totalResponseTime = botMessages.reduce((sum, msg) => sum + msg.response_time, 0);
    this.average_response_time = totalResponseTime / botMessages.length;
  }

  next();
});

// Static: Add message to chat
chatSchema.statics.addMessage = async function (sessionId, messageData, userId = null, userType = 'anonymous') {
  let chat = await this.findOne({ session_id: sessionId });

  if (!chat) {
    chat = new this({
      session_id: sessionId,
      user_id: userId,
      user_type: userType,
      messages: []
    });
  }

  chat.messages.push(messageData);

  if (userId && !chat.user_id) {
    chat.user_id = userId;
    chat.user_type = userType;
  }

  return await chat.save();
};

// Static: Get stats
chatSchema.statics.getStats = async function () {
  const totalChats = await this.countDocuments();
  const activeChats = await this.countDocuments({ is_active: true });
  const resolvedChats = await this.countDocuments({ resolved: true });

  const messageAgg = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$total_messages' } } }
  ]);

  const certAgg = await this.aggregate([
    { $group: { _id: null, total: { $sum: '$certificates_requested' } } }
  ]);

  // Average response time
  const responseTimeAgg = await this.aggregate([
    { $match: { average_response_time: { $gt: 0 } } },
    { $group: { _id: null, avg: { $avg: '$average_response_time' } } }
  ]);

  // Intent distribution
  const intentAgg = await this.aggregate([
    { $unwind: '$messages' },
    { $match: { 'messages.data.intent': { $exists: true } } },
    { $group: { _id: '$messages.data.intent', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // Feedback stats
  const feedbackAgg = await this.aggregate([
    { $unwind: '$messages' },
    { $match: { 'messages.feedback.rating': { $exists: true, $ne: null } } },
    { $group: { _id: '$messages.feedback.rating', count: { $sum: 1 } } }
  ]);

  const helpfulCount = feedbackAgg.find(f => f._id === 'helpful')?.count || 0;
  const notHelpfulCount = feedbackAgg.find(f => f._id === 'not_helpful')?.count || 0;
  const totalFeedback = helpfulCount + notHelpfulCount;

  return {
    total_chats: totalChats,
    active_chats: activeChats,
    resolved_chats: resolvedChats,
    total_messages: messageAgg[0]?.total || 0,
    total_certificates: certAgg[0]?.total || 0,
    average_response_time: Math.round(responseTimeAgg[0]?.avg || 0),
    satisfaction_rate: totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0,
    helpful_responses: helpfulCount,
    not_helpful_responses: notHelpfulCount,
    intent_distribution: intentAgg.map(i => ({ intent: i._id, count: i.count }))
  };
};

// Method: Submit feedback for a message
chatSchema.methods.submitFeedback = function (messageIndex, rating, comment = null) {
  if (messageIndex >= 0 && messageIndex < this.messages.length) {
    this.messages[messageIndex].feedback = {
      rating,
      comment,
      timestamp: new Date()
    };
    return this.save();
  }
  throw new Error('Invalid message index');
};

// Method: Get summary
chatSchema.methods.getSummary = function () {
  const lastMessage = this.messages[this.messages.length - 1];
  return {
    session_id: this.session_id,
    user_type: this.user_type,
    total_messages: this.total_messages,
    certificates_requested: this.certificates_requested,
    last_activity: this.last_activity,
    average_response_time: this.average_response_time,
    resolved: this.resolved,
    last_message: lastMessage ? {
      text: lastMessage.text.substring(0, 100),
      sender: lastMessage.sender,
      timestamp: lastMessage.timestamp
    } : null
  };
};

module.exports = mongoose.model('Chat', chatSchema);

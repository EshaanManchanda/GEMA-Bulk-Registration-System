const express = require('express')
const Website = require('../models/Website')
const Chat = require('../models/Chat')
const User = require('../models/User')
const { authenticateToken, requirePermission } = require('../middleware/auth')

const router = express.Router()

// Get dashboard statistics
router.get('/stats', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      case '90d':
        startDate.setDate(now.getDate() - 90)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }
    
    // Get basic counts
    const [totalWebsites, activeWebsites, totalChats, chatStats] = await Promise.all([
      Website.countDocuments(),
      Website.countDocuments({ isActive: true }),
      Chat.countDocuments(),
      Chat.getStats()
    ])
    
    // Get recent activity
    const recentChats = await Chat.find({
      createdAt: { $gte: startDate }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('sessionId messageCount certificateRequestCount createdAt userInfo')
    
    // Calculate certificate generation stats
    const certificateStats = {
      total: 0,
      successful: 0,
      failed: 0,
      byWebsite: {}
    }
    
    // Count certificate requests from chat data
    recentChats.forEach(chat => {
      certificateStats.total += chat.certificateRequestCount || 0
      
      // Analyze messages for certificate success/failure
      chat.messages?.forEach(message => {
        if (message.data?.type === 'certificate_generated') {
          certificateStats.successful++
          const websiteName = message.data.website || 'Unknown'
          certificateStats.byWebsite[websiteName] = (certificateStats.byWebsite[websiteName] || 0) + 1
        }
      })
    })
    
    // Get website statistics
    const websiteStats = await Website.aggregate([
      {
        $group: {
          _id: null,
          totalWebsites: { $sum: 1 },
          activeWebsites: {
            $sum: {
              $cond: [{ $eq: ['$isActive', true] }, 1, 0]
            }
          },
          websitesWithApiKey: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$apiKey', null] },
                    { $ne: ['$apiKey', ''] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])
    
    // Get top websites by domain mentions in chats
    const topWebsites = await Website.find({ isActive: true })
      .select('name domain link examDate')
      .sort({ createdAt: -1 })
      .limit(5)
    
    // Calculate growth metrics
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setTime(previousPeriodStart.getTime() - (now.getTime() - startDate.getTime()))
    
    const [currentPeriodChats, previousPeriodChats] = await Promise.all([
      Chat.countDocuments({ createdAt: { $gte: startDate } }),
      Chat.countDocuments({ 
        createdAt: { 
          $gte: previousPeriodStart, 
          $lt: startDate 
        } 
      })
    ])
    
    const chatGrowth = previousPeriodChats > 0 
      ? ((currentPeriodChats - previousPeriodChats) / previousPeriodChats * 100).toFixed(1)
      : 0
    
    res.json({
      overview: {
        totalWebsites,
        activeWebsites,
        totalChats,
        totalMessages: chatStats.totalMessages || 0,
        certificatesGenerated: certificateStats.successful
      },
      
      certificates: {
        total: certificateStats.total,
        successful: certificateStats.successful,
        failed: certificateStats.failed,
        successRate: certificateStats.total > 0 
          ? ((certificateStats.successful / certificateStats.total) * 100).toFixed(1)
          : 0,
        byWebsite: certificateStats.byWebsite
      },
      
      websites: {
        total: websiteStats[0]?.totalWebsites || 0,
        active: websiteStats[0]?.activeWebsites || 0,
        withApiKey: websiteStats[0]?.websitesWithApiKey || 0,
        top: topWebsites
      },
      
      activity: {
        timeRange,
        chatsInPeriod: currentPeriodChats,
        chatGrowth: `${chatGrowth}%`,
        recentChats: recentChats.map(chat => ({
          sessionId: chat.sessionId,
          messageCount: chat.messageCount,
          certificateRequests: chat.certificateRequestCount,
          createdAt: chat.createdAt,
          userInfo: chat.userInfo
        }))
      },
      
      generatedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({
      message: 'Failed to retrieve dashboard statistics'
    })
  }
})

// Get chat analytics
router.get('/analytics/chats', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeRange = '7d', groupBy = 'day' } = req.query
    
    // Calculate date range
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case '24h':
        startDate.setHours(now.getHours() - 24)
        break
      case '7d':
        startDate.setDate(now.getDate() - 7)
        break
      case '30d':
        startDate.setDate(now.getDate() - 30)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }
    
    // Group chats by time period
    let groupFormat
    switch (groupBy) {
      case 'hour':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
          hour: { $hour: '$createdAt' }
        }
        break
      case 'day':
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        }
        break
      case 'week':
        groupFormat = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        }
        break
      default:
        groupFormat = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        }
    }
    
    const chatAnalytics = await Chat.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: groupFormat,
          chatCount: { $sum: 1 },
          totalMessages: { $sum: '$messageCount' },
          totalCertificateRequests: { $sum: '$certificateRequestCount' },
          avgMessagesPerChat: { $avg: '$messageCount' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ])
    
    // Get popular intents/topics
    const popularTopics = await Chat.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$tags'
      },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ])
    
    res.json({
      timeRange,
      groupBy,
      analytics: chatAnalytics,
      popularTopics,
      summary: {
        totalChats: chatAnalytics.reduce((sum, item) => sum + item.chatCount, 0),
        totalMessages: chatAnalytics.reduce((sum, item) => sum + item.totalMessages, 0),
        totalCertificateRequests: chatAnalytics.reduce((sum, item) => sum + item.totalCertificateRequests, 0),
        avgMessagesPerChat: chatAnalytics.length > 0 
          ? (chatAnalytics.reduce((sum, item) => sum + item.avgMessagesPerChat, 0) / chatAnalytics.length).toFixed(2)
          : 0
      }
    })
    
  } catch (error) {
    console.error('Chat analytics error:', error)
    res.status(500).json({
      message: 'Failed to retrieve chat analytics'
    })
  }
})

// Get website performance analytics
router.get('/analytics/websites', authenticateToken, requirePermission('view_analytics'), async (req, res) => {
  try {
    const websites = await Website.find()
      .select('name domain link isActive apiKey examDate createdAt')
      .sort({ createdAt: -1 })
    
    // Analyze website performance based on chat mentions
    const websitePerformance = await Promise.all(
      websites.map(async (website) => {
        // Count mentions in chat messages (simplified)
        const mentionCount = await Chat.countDocuments({
          'messages.text': { 
            $regex: website.domain.replace(/\./g, '\\.'), 
            $options: 'i' 
          }
        })
        
        return {
          id: website._id,
          name: website.name,
          domain: website.domain,
          isActive: website.isActive,
          hasApiKey: !!(website.apiKey && website.apiKey.trim()),
          examDate: website.examDate,
          mentions: mentionCount,
          createdAt: website.createdAt
        }
      })
    )
    
    // Sort by mentions (popularity)
    websitePerformance.sort((a, b) => b.mentions - a.mentions)
    
    res.json({
      websites: websitePerformance,
      summary: {
        total: websites.length,
        active: websites.filter(w => w.isActive).length,
        withApiKey: websites.filter(w => w.apiKey && w.apiKey.trim()).length,
        totalMentions: websitePerformance.reduce((sum, w) => sum + w.mentions, 0)
      }
    })
    
  } catch (error) {
    console.error('Website analytics error:', error)
    res.status(500).json({
      message: 'Failed to retrieve website analytics'
    })
  }
})

// Get system health status
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        api: 'healthy'
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      }
    }
    
    // Test database connection
    try {
      await Website.findOne().limit(1)
      health.services.database = 'healthy'
    } catch (error) {
      health.services.database = 'unhealthy'
      health.status = 'degraded'
    }
    
    // Check if any critical services are down
    const unhealthyServices = Object.values(health.services).filter(status => status === 'unhealthy')
    if (unhealthyServices.length > 0) {
      health.status = 'unhealthy'
    }
    
    res.json(health)
    
  } catch (error) {
    console.error('Health check error:', error)
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    })
  }
})

// Export data for backup
router.get('/export', authenticateToken, requirePermission('read'), async (req, res) => {
  try {
    const { type = 'all' } = req.query
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    if (type === 'all' || type === 'websites') {
      exportData.websites = await Website.find()
        .select('-__v')
        .sort({ name: 1 })
    }
    
    if (type === 'all' || type === 'chats') {
      exportData.chats = await Chat.find()
        .select('-__v')
        .sort({ createdAt: -1 })
        .limit(1000) // Limit to recent 1000 chats
    }
    
    if (type === 'all' || type === 'users') {
      exportData.users = await User.find()
        .select('-password -__v')
        .sort({ createdAt: -1 })
    }
    
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', `attachment; filename=gema-chatbot-export-${Date.now()}.json`)
    res.json(exportData)
    
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({
      message: 'Failed to export data'
    })
  }
})

module.exports = router
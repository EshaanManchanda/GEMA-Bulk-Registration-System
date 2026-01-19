const express = require('express')
const Website = require('../models/Website')
const Chat = require('../models/Chat')
const { optionalAuth } = require('../middleware/auth')
const axios = require('axios')

const router = express.Router()

// Generate certificate
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const { websiteId, websiteUrl, studentEmail, sessionId } = req.body
    
    // Validate input
    if (!studentEmail) {
      return res.status(400).json({
        message: 'Student email is required'
      })
    }
    
    if (!websiteId && !websiteUrl) {
      return res.status(400).json({
        message: 'Website ID or URL is required'
      })
    }
    
    // Find website
    let website
    if (websiteId) {
      website = await Website.findById(websiteId)
    } else {
      // Extract domain from URL
      const urlPattern = /https?:\/\/(www\.)?([a-zA-Z0-9.-]+)/
      const match = websiteUrl.match(urlPattern)
      const domain = match ? match[2] : websiteUrl
      
      website = await Website.findOne({
        $or: [
          { domain: { $regex: domain, $options: 'i' } },
          { link: { $regex: domain, $options: 'i' } }
        ]
      })
    }
    
    if (!website) {
      return res.status(404).json({
        message: 'Website not found. Please check the website URL or contact support.'
      })
    }
    
    // Check if website can generate certificates
    const canGenerate = website.canGenerateCertificate()
    if (!canGenerate.canGenerate) {
      return res.status(400).json({
        message: canGenerate.reason
      })
    }
    
    // Generate certificate
    try {
      const response = await axios.post(
        website.certificateEndpoint,
        { student_email: studentEmail },
        {
          headers: {
            'Authorization': `Bearer ${website.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 second timeout
        }
      )
      
      // Log successful certificate generation
      if (sessionId) {
        await Chat.addMessage(sessionId, {
          text: `Certificate generated for ${studentEmail} from ${website.name}`,
          sender: 'system',
          data: {
            type: 'certificate_generated',
            website: website.name,
            email: studentEmail,
            downloadUrl: response.data.download_url
          }
        })
      }
      
      res.json({
        message: 'Certificate generated successfully',
        website: {
          id: website._id,
          name: website.name,
          domain: website.domain
        },
        certificate: {
          downloadUrl: response.data.download_url,
          studentEmail: studentEmail,
          generatedAt: new Date().toISOString()
        },
        apiResponse: response.data
      })
      
    } catch (apiError) {
      console.error('Certificate API error:', apiError.response?.data || apiError.message)
      
      // Handle specific API errors
      if (apiError.response?.status === 404 || 
          apiError.response?.data?.code === 'student_not_found') {
        return res.status(404).json({
          message: 'No student found with the provided email address.',
          details: 'Please check your email address or contact the competition organizers if you believe this is an error.'
        })
      }
      
      if (apiError.response?.status === 401) {
        return res.status(500).json({
          message: 'Certificate service authentication failed. Please contact support.'
        })
      }
      
      if (apiError.code === 'ECONNREFUSED' || apiError.code === 'ENOTFOUND') {
        return res.status(503).json({
          message: 'Certificate service is currently unavailable. Please try again later.'
        })
      }
      
      if (apiError.code === 'ECONNABORTED') {
        return res.status(408).json({
          message: 'Certificate generation timed out. Please try again.'
        })
      }
      
      // Generic error
      return res.status(500).json({
        message: 'Failed to generate certificate. Please try again later.',
        error: process.env.NODE_ENV === 'development' ? apiError.message : undefined
      })
    }
    
  } catch (error) {
    console.error('Certificate generation error:', error)
    res.status(500).json({
      message: 'Internal server error while generating certificate'
    })
  }
})

// Get certificate status/info
router.get('/status/:websiteId/:email', optionalAuth, async (req, res) => {
  try {
    const { websiteId, email } = req.params
    
    const website = await Website.findById(websiteId)
    if (!website) {
      return res.status(404).json({
        message: 'Website not found'
      })
    }
    
    // Check if website supports certificate status checking
    const canGenerate = website.canGenerateCertificate()
    if (!canGenerate.canGenerate) {
      return res.status(400).json({
        message: canGenerate.reason
      })
    }
    
    // Try to get certificate info (this would depend on the API)
    // For now, we'll just return website info
    res.json({
      website: {
        id: website._id,
        name: website.name,
        domain: website.domain,
        examDate: website.examDate
      },
      email: email,
      canGenerate: true,
      message: 'Certificate generation is available for this website'
    })
    
  } catch (error) {
    console.error('Certificate status error:', error)
    res.status(500).json({
      message: 'Failed to check certificate status'
    })
  }
})

// Validate email for certificate generation
router.post('/validate-email', optionalAuth, async (req, res) => {
  try {
    const { email, websiteId } = req.body
    
    if (!email) {
      return res.status(400).json({
        message: 'Email is required'
      })
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format'
      })
    }
    
    let website = null
    if (websiteId) {
      website = await Website.findById(websiteId)
    }
    
    res.json({
      valid: true,
      email: email,
      website: website ? {
        id: website._id,
        name: website.name,
        canGenerate: website.canGenerateCertificate().canGenerate
      } : null,
      message: 'Email format is valid'
    })
    
  } catch (error) {
    console.error('Email validation error:', error)
    res.status(500).json({
      message: 'Failed to validate email'
    })
  }
})

// Get available certificate websites
router.get('/websites', async (req, res) => {
  try {
    const websites = await Website.find({
      isActive: true,
      apiKey: { $exists: true, $ne: '' }
    })
    .select('name domain link examDate description')
    .sort({ name: 1 })
    
    const availableWebsites = websites.filter(website => {
      return website.canGenerateCertificate().canGenerate
    })
    
    res.json({
      websites: availableWebsites.map(website => ({
        id: website._id,
        name: website.name,
        domain: website.domain,
        link: website.link,
        examDate: website.examDate,
        description: website.description
      })),
      total: availableWebsites.length
    })
    
  } catch (error) {
    console.error('Get certificate websites error:', error)
    res.status(500).json({
      message: 'Failed to retrieve certificate websites'
    })
  }
})

// Bulk certificate generation (for admin use)
router.post('/bulk-generate', optionalAuth, async (req, res) => {
  try {
    const { websiteId, emails, sessionId } = req.body
    
    if (!websiteId || !emails || !Array.isArray(emails)) {
      return res.status(400).json({
        message: 'Website ID and emails array are required'
      })
    }
    
    if (emails.length > 50) {
      return res.status(400).json({
        message: 'Maximum 50 emails allowed per bulk request'
      })
    }
    
    const website = await Website.findById(websiteId)
    if (!website) {
      return res.status(404).json({
        message: 'Website not found'
      })
    }
    
    const canGenerate = website.canGenerateCertificate()
    if (!canGenerate.canGenerate) {
      return res.status(400).json({
        message: canGenerate.reason
      })
    }
    
    const results = {
      successful: [],
      failed: [],
      total: emails.length
    }
    
    // Process emails with delay to avoid overwhelming the API
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i]
      
      try {
        const response = await axios.post(
          website.certificateEndpoint,
          { student_email: email },
          {
            headers: {
              'Authorization': `Bearer ${website.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        )
        
        results.successful.push({
          email: email,
          downloadUrl: response.data.download_url
        })
        
      } catch (error) {
        results.failed.push({
          email: email,
          error: error.response?.data?.message || error.message
        })
      }
      
      // Add delay between requests (500ms)
      if (i < emails.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // Log bulk generation
    if (sessionId) {
      await Chat.addMessage(sessionId, {
        text: `Bulk certificate generation completed: ${results.successful.length} successful, ${results.failed.length} failed`,
        sender: 'system',
        data: {
          type: 'bulk_certificate_generated',
          website: website.name,
          results: results
        }
      })
    }
    
    res.json({
      message: `Bulk certificate generation completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      results: results
    })
    
  } catch (error) {
    console.error('Bulk certificate generation error:', error)
    res.status(500).json({
      message: 'Failed to process bulk certificate generation'
    })
  }
})

module.exports = router
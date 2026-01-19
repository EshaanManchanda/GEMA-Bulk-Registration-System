const express = require('express')
const Website = require('../models/Website')
const { authenticateToken, requirePermission } = require('../middleware/auth')
const multer = require('multer')
const csv = require('csv-parser')
const fs = require('fs')
const path = require('path')

const router = express.Router()

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are allowed'), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Get all websites
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query
    
    let query = {}
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { domain: { $regex: search, $options: 'i' } },
          { link: { $regex: search, $options: 'i' } }
        ]
      }
    }
    
    const websites = await Website.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec()
    
    const total = await Website.countDocuments(query)
    
    res.json({
      websites,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
    
  } catch (error) {
    console.error('Get websites error:', error)
    res.status(500).json({
      message: 'Failed to retrieve websites'
    })
  }
})

// Get website by ID
router.get('/:id', async (req, res) => {
  try {
    const website = await Website.findById(req.params.id)
    
    if (!website) {
      return res.status(404).json({
        message: 'Website not found'
      })
    }
    
    res.json(website)
    
  } catch (error) {
    console.error('Get website error:', error)
    res.status(500).json({
      message: 'Failed to retrieve website'
    })
  }
})

// Create new website
router.post('/', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const {
      name,
      link,
      paymentLink,
      examDate,
      apiKey,
      certificateEndpoint,
      description,
      isActive
    } = req.body
    
    // Validate required fields
    if (!name || !link) {
      return res.status(400).json({
        message: 'Name and link are required'
      })
    }
    
    // Check if website already exists
    const existingWebsite = await Website.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { link: link }
      ]
    })
    
    if (existingWebsite) {
      return res.status(400).json({
        message: 'Website with this name or link already exists'
      })
    }
    
    const website = new Website({
      name,
      link,
      paymentLink,
      examDate,
      apiKey,
      certificateEndpoint,
      description,
      isActive: isActive !== undefined ? isActive : true
    })
    
    await website.save()
    
    res.status(201).json({
      message: 'Website created successfully',
      website
    })
    
  } catch (error) {
    console.error('Create website error:', error)
    res.status(500).json({
      message: 'Failed to create website'
    })
  }
})

// Update website
router.put('/:id', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const {
      name,
      link,
      paymentLink,
      examDate,
      apiKey,
      certificateEndpoint,
      description,
      isActive
    } = req.body
    
    const website = await Website.findById(req.params.id)
    
    if (!website) {
      return res.status(404).json({
        message: 'Website not found'
      })
    }
    
    // Check for duplicate name/link (excluding current website)
    if (name || link) {
      const duplicateQuery = {
        _id: { $ne: req.params.id },
        $or: []
      }
      
      if (name) {
        duplicateQuery.$or.push({ name: { $regex: new RegExp(`^${name}$`, 'i') } })
      }
      
      if (link) {
        duplicateQuery.$or.push({ link: link })
      }
      
      if (duplicateQuery.$or.length > 0) {
        const existingWebsite = await Website.findOne(duplicateQuery)
        
        if (existingWebsite) {
          return res.status(400).json({
            message: 'Website with this name or link already exists'
          })
        }
      }
    }
    
    // Update fields
    if (name !== undefined) website.name = name
    if (link !== undefined) website.link = link
    if (paymentLink !== undefined) website.paymentLink = paymentLink
    if (examDate !== undefined) website.examDate = examDate
    if (apiKey !== undefined) website.apiKey = apiKey
    if (certificateEndpoint !== undefined) website.certificateEndpoint = certificateEndpoint
    if (description !== undefined) website.description = description
    if (isActive !== undefined) website.isActive = isActive
    
    await website.save()
    
    res.json({
      message: 'Website updated successfully',
      website
    })
    
  } catch (error) {
    console.error('Update website error:', error)
    res.status(500).json({
      message: 'Failed to update website'
    })
  }
})

// Delete website
router.delete('/:id', authenticateToken, requirePermission('delete'), async (req, res) => {
  try {
    const website = await Website.findById(req.params.id)
    
    if (!website) {
      return res.status(404).json({
        message: 'Website not found'
      })
    }
    
    await Website.findByIdAndDelete(req.params.id)
    
    res.json({
      message: 'Website deleted successfully'
    })
    
  } catch (error) {
    console.error('Delete website error:', error)
    res.status(500).json({
      message: 'Failed to delete website'
    })
  }
})

// Import websites from CSV
router.post('/import', authenticateToken, requirePermission('write'), upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'CSV file is required'
      })
    }
    
    const results = []
    const errors = []
    let lineNumber = 1
    
    // Read and parse CSV file
    const stream = fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => {
        lineNumber++
        
        // Map CSV columns to our schema
        const websiteData = {
          name: data['Website Name'] || data['name'] || data['Name'],
          link: data['Links'] || data['link'] || data['Link'] || data['URL'],
          paymentLink: data['Payment Links'] || data['paymentLink'] || data['Payment Link'],
          examDate: data['Exam Date'] || data['examDate'] || data['Date'],
          apiKey: data['API Key'] || data['apiKey'],
          description: data['Description'] || data['description']
        }
        
        // Validate required fields
        if (!websiteData.name || !websiteData.link) {
          errors.push({
            line: lineNumber,
            error: 'Missing required fields: name and link',
            data: websiteData
          })
          return
        }
        
        results.push(websiteData)
      })
      .on('end', async () => {
        try {
          // Clean up uploaded file
          fs.unlinkSync(req.file.path)
          
          if (results.length === 0) {
            return res.status(400).json({
              message: 'No valid data found in CSV file',
              errors
            })
          }
          
          // Insert websites (skip duplicates)
          const imported = []
          const skipped = []
          
          for (const websiteData of results) {
            try {
              // Check for existing website
              const existing = await Website.findOne({
                $or: [
                  { name: { $regex: new RegExp(`^${websiteData.name}$`, 'i') } },
                  { link: websiteData.link }
                ]
              })
              
              if (existing) {
                skipped.push({
                  name: websiteData.name,
                  reason: 'Already exists'
                })
                continue
              }
              
              const website = new Website(websiteData)
              await website.save()
              imported.push(website)
              
            } catch (error) {
              errors.push({
                name: websiteData.name,
                error: error.message
              })
            }
          }
          
          res.json({
            message: `Import completed. ${imported.length} websites imported, ${skipped.length} skipped, ${errors.length} errors.`,
            imported: imported.length,
            skipped: skipped.length,
            errors: errors.length,
            details: {
              imported: imported.map(w => ({ id: w._id, name: w.name })),
              skipped,
              errors
            }
          })
          
        } catch (error) {
          console.error('CSV processing error:', error)
          res.status(500).json({
            message: 'Failed to process CSV file'
          })
        }
      })
      .on('error', (error) => {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
        }
        
        console.error('CSV parsing error:', error)
        res.status(400).json({
          message: 'Failed to parse CSV file',
          error: error.message
        })
      })
    
  } catch (error) {
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    
    console.error('Import error:', error)
    res.status(500).json({
      message: 'Failed to import websites'
    })
  }
})

// Export websites to JSON
router.get('/export/json', authenticateToken, requirePermission('read'), async (req, res) => {
  try {
    const websites = await Website.find({ isActive: true })
      .select('-__v -createdAt -updatedAt')
      .sort({ name: 1 })
    
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Content-Disposition', 'attachment; filename=websites.json')
    res.json(websites)
    
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({
      message: 'Failed to export websites'
    })
  }
})

// Search websites by domain
router.get('/search/domain/:domain', async (req, res) => {
  try {
    const { domain } = req.params
    const websites = await Website.searchByDomain(domain)
    
    res.json(websites)
    
  } catch (error) {
    console.error('Domain search error:', error)
    res.status(500).json({
      message: 'Failed to search websites'
    })
  }
})

// Test certificate generation for a website
router.post('/:id/test-certificate', authenticateToken, requirePermission('write'), async (req, res) => {
  try {
    const { testEmail } = req.body
    
    if (!testEmail) {
      return res.status(400).json({
        message: 'Test email is required'
      })
    }
    
    const website = await Website.findById(req.params.id)
    
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
    
    // Test the certificate generation
    const axios = require('axios')
    
    try {
      const response = await axios.post(
        website.certificateEndpoint,
        { student_email: testEmail },
        {
          headers: {
            'Authorization': `Bearer ${website.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      )
      
      res.json({
        message: 'Certificate generation test successful',
        response: response.data
      })
      
    } catch (error) {
      res.status(400).json({
        message: 'Certificate generation test failed',
        error: error.response?.data || error.message
      })
    }
    
  } catch (error) {
    console.error('Test certificate error:', error)
    res.status(500).json({
      message: 'Failed to test certificate generation'
    })
  }
})

module.exports = router
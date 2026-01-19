const mongoose = require('mongoose')

const websiteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  india: {
    link: { type: String, trim: true },
    paymentLink: { type: String, trim: true },
    registrationLink: { type: String, trim: true },
    resultLink: { type: String, trim: true },
    apiKey: { type: String, trim: true },
    fee: { type: String, trim: true }
  },
  international: {
    link: { type: String, trim: true },
    paymentLink: { type: String, trim: true },
    registrationLink: { type: String, trim: true },
    resultLink: { type: String, trim: true },
    apiKey: { type: String, trim: true },
    fee: { type: String, trim: true }
  },
  examDate: {
    type: String,
    trim: true,
    default: ''
  },
  lastDateofRegister: {
    type: String,
    trim: true,
    default: ''
  },
  category: {
    type: Map,
    of: String
  },
  contact: {
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    internationalPhone: { type: String, trim: true },
    address: { type: String, trim: true }
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Pre-save middleware to validate URLs and update timestamps
websiteSchema.pre('save', function(next) {
  // Validate international URL if exists
  if (this.international?.link) {
    try {
      new URL(this.international.link)
    } catch (error) {
      throw new Error(`Invalid international URL: ${this.international.link}`)
    }
  }
  
  // Validate india URL if exists
  if (this.india?.link) {
    try {
      new URL(this.india.link)
    } catch (error) {
      throw new Error(`Invalid india URL: ${this.india.link}`)
    }
  }
  
  this.lastUpdated = new Date()
  next()
})

// Index for faster searches
websiteSchema.index({ name: 'text', domain: 'text', description: 'text' })
websiteSchema.index({ domain: 1 })
websiteSchema.index({ isActive: 1 })

// Virtual for certificate API URL (uses international link by default)
websiteSchema.virtual('certificateApiUrl').get(function() {
  const baseUrl = this.international?.link || this.india?.link
  if (!baseUrl) return null
  
  try {
    const url = new URL(baseUrl)
    return `${url.protocol}//${url.hostname}/api/certificates`
  } catch (error) {
    return null
  }
})

// Method to check if website has certificate generation capability
websiteSchema.methods.hasCertificateGeneration = function() {
  return !!(this.international?.apiKey || this.india?.apiKey)
}

// Static method to find by domain (checks both international and india links)
websiteSchema.statics.findByDomain = function(domain) {
  const cleanDomain = domain.replace('www.', '').toLowerCase()
  return this.findOne({
    $and: [
      { isActive: true },
      {
        $or: [
          { 'international.link': { $regex: cleanDomain, $options: 'i' } },
          { 'india.link': { $regex: cleanDomain, $options: 'i' } }
        ]
      }
    ]
  })
}

// Static method to search websites with improved query handling
websiteSchema.statics.searchWebsites = function(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Search query must be a non-empty string')
  }
  
  const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { 'category.$*': searchRegex },
          { 'international.link': searchRegex },
          { 'india.link': searchRegex }
        ]
      }
    ]
  })
}

module.exports = mongoose.model('Website', websiteSchema)
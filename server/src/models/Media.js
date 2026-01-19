const mongoose = require('mongoose');

/**
 * Media Model
 * Tracks all uploaded media files in the system
 */
const mediaSchema = new mongoose.Schema({
  // File Info
  filename: {
    type: String,
    required: [true, 'Filename is required']
  },
  original_filename: {
    type: String,
    required: [true, 'Original filename is required']
  },
  file_url: {
    type: String,
    required: [true, 'File URL is required']
  },
  storage_url: {
    type: String,
    required: [true, 'Storage URL is required']
  },
  thumbnail_url: {
    type: String
  },

  // Cloudinary specific
  public_id: {
    type: String
  },

  // Metadata
  file_type: {
    type: String,
    enum: ['image', 'pdf', 'excel', 'other'],
    required: [true, 'File type is required']
  },
  mime_type: {
    type: String,
    required: [true, 'MIME type is required']
  },
  file_size: {
    type: Number,
    required: [true, 'File size is required']
  },

  // Image-specific metadata
  dimensions: {
    width: Number,
    height: Number
  },

  // Organization
  folder: {
    type: String,
    default: 'media'
  },
  tags: [{
    type: String
  }],
  alt_text: {
    type: String
  },
  caption: {
    type: String
  },

  // Storage
  storage_provider: {
    type: String,
    enum: ['cloudinary', 'local'],
    required: [true, 'Storage provider is required']
  },

  // Tracking
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: [true, 'Uploader is required']
  },
  used_in: [{
    model: {
      type: String,
      enum: ['Event', 'School', 'Certificate']
    },
    document_id: mongoose.Schema.Types.ObjectId,
    field: String
  }],

  // Timestamps
  uploaded_at: {
    type: Date,
    default: Date.now
  },
  last_modified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
mediaSchema.index({ file_type: 1, uploaded_at: -1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ uploaded_by: 1 });
mediaSchema.index({ 'used_in.model': 1, 'used_in.document_id': 1 });
mediaSchema.index({ original_filename: 'text', alt_text: 'text', caption: 'text' });

// Virtual for formatted file size
mediaSchema.virtual('file_size_formatted').get(function() {
  const size = this.file_size;
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
  return (size / (1024 * 1024)).toFixed(2) + ' MB';
});

// Pre-save middleware to update last_modified
mediaSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.last_modified = Date.now();
  }
  next();
});

module.exports = mongoose.model('Media', mediaSchema);

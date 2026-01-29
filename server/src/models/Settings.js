const mongoose = require('mongoose');

/**
 * Settings Schema
 * Stores system-wide configuration (Singleton pattern)
 */
const settingsSchema = new mongoose.Schema({
  system_name: {
    type: String,
    default: 'GEMA Events',
    trim: true,
    maxlength: [100, 'System name cannot exceed 100 characters']
  },
  default_currency: {
    type: String,
    enum: {
      values: ['INR', 'USD'],
      message: '{VALUE} is not a supported currency'
    },
    default: 'INR'
  },
  maintenance_mode: {
    type: Boolean,
    default: false
  },
  registration_open: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  payment_gateway: {
    stripe: {
      publishable_key: { type: String, trim: true },
      secret_key: { type: String, trim: true },
      enabled: { type: Boolean, default: true }
    },
    razorpay: {
      key_id: { type: String, trim: true },
      key_secret: { type: String, trim: true },
      enabled: { type: Boolean, default: false }
    },
    offline: {
      enabled: { type: Boolean, default: true }
    }
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// ===============================================
// STATIC METHODS
// ===============================================

/**
 * Get settings instance (Singleton pattern)
 * Creates settings if doesn't exist
 * @returns {Promise<Settings>} - Settings document
 */
settingsSchema.statics.getInstance = async function () {
  let settings = await this.findOne();

  if (!settings) {
    settings = await this.create({});
  }

  return settings;
};

// ===============================================
// MODEL
// ===============================================

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;

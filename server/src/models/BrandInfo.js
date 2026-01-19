const mongoose = require('mongoose');

const brandInfoSchema = new mongoose.Schema(
  {
    // Always a singleton document
    _id: {
      type: String,
      default: 'brand_info',
    },

    // Company Info
    company_name: {
      type: String,
      default: 'GEMA',
    },
    tagline: {
      type: String,
      default: 'Global Education & Management Academy',
    },

    // Contact Info
    address: {
      type: String,
      default: '48, Level 20, Burj Gate Tower, Downtown Dubai, UAE',
    },
    phone: {
      type: String,
      default: '+971-527809450',
    },
    email: {
      type: String,
      default: 'club@gemadubai.com',
    },

    // Website & Social Links
    website: {
      type: String,
      default: 'https://gemadubai.com/',
    },
    facebook: {
      type: String,
      default: 'https://www.facebook.com/gemavarsity/',
    },
    instagram: {
      type: String,
      default: 'https://www.instagram.com/gemavarsity',
    },
    youtube: {
      type: String,
      default: 'https://www.youtube.com/@gema7853',
    },
    whatsapp: {
      type: String,
      default: 'https://api.whatsapp.com/send?phone=971527809450',
    },
    linkedin: {
      type: String,
      default: '',
    },
    twitter: {
      type: String,
      default: '',
    },

    // Logo URLs
    logo_url: {
      type: String,
      default: '/assets/images/gema-logo.png',
    },
    logo_white_url: {
      type: String,
      default: '',
    },
    favicon_url: {
      type: String,
      default: '',
    },

    // Support Info
    support_email: {
      type: String,
      default: 'club@gemadubai.com',
    },
    support_phone: {
      type: String,
      default: '+971-527809450',
    },
    support_hours: {
      type: String,
      default: 'Mon-Fri 9:00 AM - 6:00 PM (GST)',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one document exists
brandInfoSchema.statics.get = async function () {
  let brandInfo = await this.findById('brand_info');
  if (!brandInfo) {
    brandInfo = await this.create({ _id: 'brand_info' });
  }
  return brandInfo;
};

brandInfoSchema.statics.updateInfo = async function (updates) {
  const brandInfo = await this.findByIdAndUpdate(
    'brand_info',
    { $set: updates },
    { new: true, upsert: true, runValidators: true }
  );
  return brandInfo;
};

module.exports = mongoose.model('BrandInfo', brandInfoSchema);

const mongoose = require('mongoose');
const { CURRENCIES } = require('../utils/constants');

/**
 * Country Currency Schema
 * Maps countries to their respective currencies for the application
 */
const countryCurrencySchema = new mongoose.Schema({
  country_name: {
    type: String,
    required: [true, 'Country name is required'],
    unique: true,
    trim: true
  },
  country_code: {
    type: String,
    required: [true, 'Country code is required'],
    uppercase: true,
    trim: true,
    minlength: [2, 'Country code must be at least 2 characters'],
    maxlength: [3, 'Country code cannot exceed 3 characters']
  },
  currency: {
    type: String,
    enum: {
      values: Object.values(CURRENCIES),
      message: '{VALUE} is not a valid currency'
    },
    required: [true, 'Currency is required']
  },
  is_active: {
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
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

// ===============================================
// INDEXES
// ===============================================

countryCurrencySchema.index({ country_name: 1 });
countryCurrencySchema.index({ country_code: 1 });
countryCurrencySchema.index({ currency: 1 });

// ===============================================
// STATIC METHODS
// ===============================================

/**
 * Get currency for a country
 * @param {string} countryName - Country name
 * @returns {Promise<string>} - Currency code
 */
countryCurrencySchema.statics.getCurrencyForCountry = async function(countryName) {
  const country = await this.findOne({
    country_name: new RegExp(`^${countryName}$`, 'i'),
    is_active: true
  });

  if (country) {
    return country.currency;
  }

  // Default to USD for countries not in the database
  return CURRENCIES.USD;
};

/**
 * Get all countries for a specific currency
 * @param {string} currency - Currency code
 * @returns {Promise<CountryCurrency[]>} - Array of countries
 */
countryCurrencySchema.statics.getCountriesByCurrency = function(currency) {
  return this.find({ currency, is_active: true }).sort({ country_name: 1 });
};

/**
 * Get all active countries
 * @returns {Promise<CountryCurrency[]>} - Array of all active countries
 */
countryCurrencySchema.statics.getAllActive = function() {
  return this.find({ is_active: true }).sort({ country_name: 1 });
};

/**
 * Bulk insert countries
 * @param {Array} countries - Array of country objects
 * @returns {Promise<Object>} - Insert result
 */
countryCurrencySchema.statics.bulkInsertCountries = async function(countries) {
  try {
    return await this.insertMany(countries, { ordered: false });
  } catch (error) {
    // Ignore duplicate key errors (E11000)
    if (error.code === 11000) {
      return { message: 'Some countries already exist and were skipped' };
    }
    throw error;
  }
};

// ===============================================
// MODEL
// ===============================================

const CountryCurrency = mongoose.model('CountryCurrency', countryCurrencySchema);

module.exports = CountryCurrency;

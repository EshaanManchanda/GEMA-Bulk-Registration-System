const CountryCurrency = require('../models/CountryCurrency');
const { CURRENCIES } = require('../utils/constants');
const logger = require('../utils/logger');

/**
 * Currency Resolver Service
 * Automatically determines currency based on country
 */
class CurrencyResolverService {
  /**
   * Get currency for a country
   * @param {string} countryName - Country name
   * @returns {Promise<string>} - Currency code (INR or USD)
   */
  async resolveCurrency(countryName) {
    try {
      // Normalize country name (trim, lowercase for comparison)
      const normalizedCountry = countryName.trim();

      // Check database for country-currency mapping
      const currency = await CountryCurrency.getCurrencyForCountry(normalizedCountry);

      logger.info(`Currency resolved for ${countryName}: ${currency}`);
      return currency;
    } catch (error) {
      logger.error(`Error resolving currency for ${countryName}:`, error);
      // Default to USD if resolution fails
      return CURRENCIES.USD;
    }
  }

  /**
   * Resolve currency for multiple countries
   * @param {Array<string>} countries - Array of country names
   * @returns {Promise<Object>} - Map of country to currency
   */
  async resolveCurrencies(countries) {
    const results = {};

    for (const country of countries) {
      results[country] = await this.resolveCurrency(country);
    }

    return results;
  }

  /**
   * Check if country uses INR
   * @param {string} countryName - Country name
   * @returns {Promise<boolean>} - True if country uses INR
   */
  async usesINR(countryName) {
    const currency = await this.resolveCurrency(countryName);
    return currency === CURRENCIES.INR;
  }

  /**
   * Check if country uses USD
   * @param {string} countryName - Country name
   * @returns {Promise<boolean>} - True if country uses USD
   */
  async usesUSD(countryName) {
    const currency = await this.resolveCurrency(countryName);
    return currency === CURRENCIES.USD;
  }

  /**
   * Get all countries using a specific currency
   * @param {string} currency - Currency code (INR or USD)
   * @returns {Promise<Array>} - Array of countries
   */
  async getCountriesByCurrency(currency) {
    try {
      const countries = await CountryCurrency.getCountriesByCurrency(currency);
      return countries.map(c => ({
        country_name: c.country_name,
        country_code: c.country_code
      }));
    } catch (error) {
      logger.error(`Error getting countries for ${currency}:`, error);
      return [];
    }
  }

  /**
   * Get all supported countries with their currencies
   * @returns {Promise<Array>} - Array of country-currency mappings
   */
  async getAllCountries() {
    try {
      const countries = await CountryCurrency.getAllActive();
      return countries.map(c => ({
        country_name: c.country_name,
        country_code: c.country_code,
        currency: c.currency
      }));
    } catch (error) {
      logger.error('Error getting all countries:', error);
      return [];
    }
  }

  /**
   * Get payment gateway for currency
   * @param {string} currency - Currency code
   * @returns {string} - Payment gateway name (always Stripe)
   */
  getPaymentGateway(currency) {
    return 'stripe';
  }

  /**
   * Get payment gateway for country
   * @param {string} countryName - Country name
   * @returns {Promise<string>} - Payment gateway name
   */
  async getPaymentGatewayForCountry(countryName) {
    const currency = await this.resolveCurrency(countryName);
    return this.getPaymentGateway(currency);
  }

  /**
   * Format currency amount
   * @param {number} amount - Amount
   * @param {string} currency - Currency code
   * @returns {string} - Formatted amount
   */
  formatAmount(amount, currency) {
    const formatters = {
      [CURRENCIES.INR]: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0
      }),
      [CURRENCIES.USD]: new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      })
    };

    return formatters[currency]?.format(amount) || `${currency} ${amount}`;
  }

  /**
   * Convert amount to smallest unit (paise for INR, cents for USD)
   * @param {number} amount - Amount in main unit
   * @param {string} currency - Currency code
   * @returns {number} - Amount in smallest unit
   */
  toSmallestUnit(amount, currency) {
    // Both INR and USD use 100 subunits (paise/cents)
    return Math.round(amount * 100);
  }

  /**
   * Convert from smallest unit to main unit
   * @param {number} amount - Amount in smallest unit
   * @param {string} currency - Currency code
   * @returns {number} - Amount in main unit
   */
  fromSmallestUnit(amount, currency) {
    return amount / 100;
  }

  /**
   * Get currency symbol
   * @param {string} currency - Currency code
   * @returns {string} - Currency symbol
   */
  getCurrencySymbol(currency) {
    const symbols = {
      [CURRENCIES.INR]: '₹',
      [CURRENCIES.USD]: '$'
    };

    return symbols[currency] || currency;
  }

  /**
   * Validate currency code
   * @param {string} currency - Currency code
   * @returns {boolean} - True if valid
   */
  isValidCurrency(currency) {
    return Object.values(CURRENCIES).includes(currency);
  }
}

// Export singleton instance
module.exports = new CurrencyResolverService();

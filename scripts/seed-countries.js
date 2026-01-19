#!/usr/bin/env node

/**
 * Seed Country-Currency Mapping Data
 * Populates the database with country to currency mappings
 *
 * Usage: node scripts/seed-countries.js
 */

require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const CountryCurrency = require('../server/src/models/CountryCurrency');
const logger = require('../server/src/utils/logger');

/**
 * Country-Currency mapping data
 * India uses INR, all others use USD for this application
 */
const countries = [
  // INR Countries
  { country_name: 'India', country_code: 'IN', currency: 'INR' },

  // USD Countries (Major international locations)
  // Middle East
  { country_name: 'Qatar', country_code: 'QA', currency: 'USD' },
  { country_name: 'United Arab Emirates', country_code: 'AE', currency: 'USD' },
  { country_name: 'Saudi Arabia', country_code: 'SA', currency: 'USD' },
  { country_name: 'Kuwait', country_code: 'KW', currency: 'USD' },
  { country_name: 'Bahrain', country_code: 'BH', currency: 'USD' },
  { country_name: 'Oman', country_code: 'OM', currency: 'USD' },

  // North America
  { country_name: 'United States', country_code: 'US', currency: 'USD' },
  { country_name: 'Canada', country_code: 'CA', currency: 'USD' },

  // Europe
  { country_name: 'United Kingdom', country_code: 'GB', currency: 'USD' },
  { country_name: 'Germany', country_code: 'DE', currency: 'USD' },
  { country_name: 'France', country_code: 'FR', currency: 'USD' },
  { country_name: 'Netherlands', country_code: 'NL', currency: 'USD' },
  { country_name: 'Switzerland', country_code: 'CH', currency: 'USD' },
  { country_name: 'Italy', country_code: 'IT', currency: 'USD' },
  { country_name: 'Spain', country_code: 'ES', currency: 'USD' },
  { country_name: 'Belgium', country_code: 'BE', currency: 'USD' },
  { country_name: 'Austria', country_code: 'AT', currency: 'USD' },
  { country_name: 'Sweden', country_code: 'SE', currency: 'USD' },
  { country_name: 'Norway', country_code: 'NO', currency: 'USD' },
  { country_name: 'Denmark', country_code: 'DK', currency: 'USD' },
  { country_name: 'Finland', country_code: 'FI', currency: 'USD' },

  // Asia Pacific
  { country_name: 'Singapore', country_code: 'SG', currency: 'USD' },
  { country_name: 'Hong Kong', country_code: 'HK', currency: 'USD' },
  { country_name: 'Japan', country_code: 'JP', currency: 'USD' },
  { country_name: 'South Korea', country_code: 'KR', currency: 'USD' },
  { country_name: 'Australia', country_code: 'AU', currency: 'USD' },
  { country_name: 'New Zealand', country_code: 'NZ', currency: 'USD' },
  { country_name: 'Malaysia', country_code: 'MY', currency: 'USD' },
  { country_name: 'Thailand', country_code: 'TH', currency: 'USD' },
  { country_name: 'Indonesia', country_code: 'ID', currency: 'USD' },
  { country_name: 'Philippines', country_code: 'PH', currency: 'USD' },
  { country_name: 'Vietnam', country_code: 'VN', currency: 'USD' },
  { country_name: 'China', country_code: 'CN', currency: 'USD' },

  // South Asia (excluding India)
  { country_name: 'Pakistan', country_code: 'PK', currency: 'USD' },
  { country_name: 'Bangladesh', country_code: 'BD', currency: 'USD' },
  { country_name: 'Sri Lanka', country_code: 'LK', currency: 'USD' },
  { country_name: 'Nepal', country_code: 'NP', currency: 'USD' },
  { country_name: 'Bhutan', country_code: 'BT', currency: 'USD' },

  // Africa
  { country_name: 'South Africa', country_code: 'ZA', currency: 'USD' },
  { country_name: 'Egypt', country_code: 'EG', currency: 'USD' },
  { country_name: 'Kenya', country_code: 'KE', currency: 'USD' },
  { country_name: 'Nigeria', country_code: 'NG', currency: 'USD' },

  // Others
  { country_name: 'Brazil', country_code: 'BR', currency: 'USD' },
  { country_name: 'Mexico', country_code: 'MX', currency: 'USD' },
  { country_name: 'Argentina', country_code: 'AR', currency: 'USD' },
  { country_name: 'Russia', country_code: 'RU', currency: 'USD' },
  { country_name: 'Turkey', country_code: 'TR', currency: 'USD' }
];

async function seedCountries() {
  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Check existing countries
    const existingCount = await CountryCurrency.countDocuments();

    if (existingCount > 0) {
      console.log(`⚠ Database already has ${existingCount} countries.\n`);

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('Do you want to clear and re-seed? (yes/no): ', resolve);
      });

      readline.close();

      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('\nClearing existing countries...');
        await CountryCurrency.deleteMany({});
        console.log('✓ Existing countries cleared\n');
      } else {
        console.log('\nMerging with existing data...');
      }
    }

    // Insert countries
    console.log(`Seeding ${countries.length} countries...\n`);

    const result = await CountryCurrency.bulkInsertCountries(countries);

    console.log('✓ Countries seeded successfully!\n');
    console.log('=================================');
    console.log('Seeding Summary:');
    console.log('=================================');

    // Count by currency
    const inrCount = await CountryCurrency.countDocuments({ currency: 'INR' });
    const usdCount = await CountryCurrency.countDocuments({ currency: 'USD' });
    const totalCount = await CountryCurrency.countDocuments();

    console.log(`Total countries: ${totalCount}`);
    console.log(`  - INR countries: ${inrCount}`);
    console.log(`  - USD countries: ${usdCount}`);
    console.log('=================================\n');

    // Show sample countries
    console.log('Sample countries:');
    const samples = await CountryCurrency.find().limit(10);
    samples.forEach(country => {
      console.log(`  ${country.country_name.padEnd(30)} → ${country.currency}`);
    });

    if (totalCount > 10) {
      console.log(`  ... and ${totalCount - 10} more\n`);
    }

    logger.info(`Countries seeded: ${totalCount}`);

  } catch (error) {
    console.error('\n✗ Error seeding countries:');
    console.error(error.message);
    if (error.code === 11000) {
      console.error('\nSome countries already exist (duplicates were skipped).');
    }
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  }
}

// Run seeder
console.log('\n========================================');
console.log('GEMA Country-Currency Seeder');
console.log('========================================\n');

seedCountries();

#!/usr/bin/env node

/**
 * Test Event Seeder
 * Creates a sample test event for testing bulk registration system
 *
 * Usage: node scripts/seed-test-event.js
 */

require('../server/node_modules/dotenv').config({ path: './server/.env' });
const mongoose = require('../server/node_modules/mongoose');
const Event = require('../server/src/models/Event');
const logger = require('../server/src/utils/logger');
const { EVENT_STATUS, FIELD_TYPES } = require('../server/src/utils/constants');

async function seedTestEvent() {
  console.log('\n========================================');
  console.log('GEMA Test Event Seeder');
  console.log('========================================\n');

  try {
    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Check if test event already exists
    const existingEvent = await Event.findOne({ event_slug: 'test' });

    if (existingEvent) {
      console.log('⚠  Test event already exists:');
      console.log(`  Title: ${existingEvent.title}`);
      console.log(`  Slug: ${existingEvent.event_slug}`);
      console.log(`  Status: ${existingEvent.status}`);
      console.log(`  Created: ${existingEvent.created_at}\n`);

      // Ask if user wants to recreate
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Do you want to delete and recreate it? (yes/no): ', resolve);
      });

      rl.close();

      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        await Event.findByIdAndDelete(existingEvent._id);
        console.log('✓ Old test event deleted\n');
      } else {
        console.log('\nNo changes made. Using existing test event.');
        await mongoose.connection.close();
        process.exit(0);
      }
    }

    // Create test event
    const testEvent = await Event.create({
      title: 'Test Event - Bulk Registration',
      event_slug: 'test',
      description: 'This is a test event for testing the bulk registration system. Use this event to test CSV uploads, payment flows, and invoice generation.',
      short_description: 'Sample event for testing bulk registration features',
      status: EVENT_STATUS.ACTIVE,

      // Pricing
      base_fee_inr: 500,
      base_fee_usd: 10,

      // Dates
      event_start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      event_end_date: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), // 32 days from now
      registration_deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now

      // Limits
      max_participants: 1000,
      min_participants: 10,

      // Form schema - simple test fields
      form_schema: [
        {
          field_id: 'parent_email',
          field_label: 'Parent Email',
          field_type: FIELD_TYPES.EMAIL,
          is_required: true,
          placeholder: 'parent@example.com',
          help_text: 'Email address of parent or guardian',
          order: 1
        },
        {
          field_id: 'tshirt_size',
          field_label: 'T-Shirt Size',
          field_type: FIELD_TYPES.SELECT,
          field_options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          is_required: true,
          help_text: 'Student t-shirt size for event',
          order: 2
        },
        {
          field_id: 'food_preference',
          field_label: 'Food Preference',
          field_type: FIELD_TYPES.SELECT,
          field_options: ['Vegetarian', 'Non-Vegetarian', 'Vegan'],
          is_required: false,
          help_text: 'Dietary preference for lunch',
          order: 3
        },
        {
          field_id: 'special_requirements',
          field_label: 'Special Requirements',
          field_type: FIELD_TYPES.TEXTAREA,
          is_required: false,
          placeholder: 'Any allergies, medical conditions, or special needs',
          help_text: 'Mention any special requirements or medical conditions',
          validation_rules: {
            maxLength: 500
          },
          order: 4
        }
      ],

      // Bulk discounts
      bulk_discount_rules: [
        {
          min_students: 50,
          discount_percentage: 10
        },
        {
          min_students: 100,
          discount_percentage: 15
        },
        {
          min_students: 200,
          discount_percentage: 20
        }
      ],

      // Settings
      allow_offline_payment: true,
      require_parent_approval: false,
      send_confirmation_email: false, // Email system not yet integrated

      // Metadata
      category: 'Test',
      venue: 'Virtual/Online',
      contact_email: 'test@gema-events.com'
    });

    console.log('✓ Test event created successfully!\n');
    console.log('=================================');
    console.log('Test Event Details:');
    console.log('=================================');
    console.log(`Title:             ${testEvent.title}`);
    console.log(`Slug:              ${testEvent.event_slug}`);
    console.log(`Status:            ${testEvent.status}`);
    console.log(`Price (INR):       ₹${testEvent.base_fee_inr}`);
    console.log(`Price (USD):       $${testEvent.base_fee_usd}`);
    console.log(`Max Participants:  ${testEvent.max_participants}`);
    console.log(`Form Fields:       ${testEvent.form_schema.length}`);
    console.log(`Discount Tiers:    ${testEvent.bulk_discount_rules.length}`);
    console.log(`Start Date:        ${testEvent.event_start_date.toLocaleDateString()}`);
    console.log(`Registration Ends: ${testEvent.registration_deadline.toLocaleDateString()}`);
    console.log('=================================\n');

    console.log('📝 Form Fields:');
    testEvent.form_schema.forEach((field, index) => {
      console.log(`  ${index + 1}. ${field.field_label} (${field.field_type})${field.is_required ? ' *' : ''}`);
    });
    console.log('\n💰 Discount Structure:');
    testEvent.bulk_discount_rules.forEach((rule, index) => {
      console.log(`  ${index + 1}. ${rule.min_students}+ students → ${rule.discount_percentage}% off`);
    });
    console.log('\n🔗 Next Steps:');
    console.log('  1. Download template: GET /api/v1/batches/template/test');
    console.log('  2. Fill Excel with student data');
    console.log('  3. Upload batch: POST /api/v1/batches/upload (with eventSlug: "test")');
    console.log('  4. Complete payment');
    console.log('  5. Receive invoice\n');

    logger.info(`Test event created: ${testEvent.event_slug}`);

  } catch (error) {
    console.error('\n✗ Error:');
    console.error(error.message);

    if (error.code === 11000) {
      console.error('\nDuplicate key error. Event with slug "test" already exists.');
    } else if (error.name === 'ValidationError') {
      console.error('\nValidation Error:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }

    process.exit(1);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('Database connection closed.');
    }
    process.exit(0);
  }
}

// Run seeder
seedTestEvent();

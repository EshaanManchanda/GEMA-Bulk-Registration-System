/**
 * Migration Script: Fix Registration Status
 *
 * This script updates all registrations in completed batches
 * from REGISTERED to CONFIRMED status.
 *
 * Run with: node server/scripts/migrate-registration-status.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Batch = require('../src/models/Batch');
const Registration = require('../src/models/Registration');
const { BATCH_STATUS, PAYMENT_STATUS } = require('../src/utils/constants');

async function migrateRegistrationStatus() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✓ Connected to database');
    console.log(`  Database: ${mongoose.connection.name}`);
    console.log('');

    // Find all completed batches
    const batches = await Batch.find({
      payment_status: PAYMENT_STATUS.COMPLETED,
      status: { $in: [BATCH_STATUS.SUBMITTED, BATCH_STATUS.CONFIRMED] }
    }).select('batch_reference status payment_status');

    console.log(`Found ${batches.length} completed batches to check`);
    console.log('');

    if (batches.length === 0) {
      console.log('No batches need migration. Exiting.');
      await mongoose.connection.close();
      process.exit(0);
    }

    let totalFixed = 0;
    let batchesAffected = 0;

    // Process each batch
    for (const batch of batches) {
      // Count unconfirmed registrations
      const unconfirmedCount = await Registration.countDocuments({
        batch_id: batch._id,
        status: 'registered'
      });

      if (unconfirmedCount > 0) {
        // Update registrations
        const result = await Registration.updateMany(
          { batch_id: batch._id, status: 'registered' },
          { $set: { status: 'confirmed' } }
        );

        console.log(`✓ Batch ${batch.batch_reference}`);
        console.log(`  Status: ${batch.status}`);
        console.log(`  Fixed: ${result.modifiedCount} registrations`);
        console.log('');

        totalFixed += result.modifiedCount;
        batchesAffected++;
      }
    }

    // Summary
    console.log('='.repeat(50));
    console.log('Migration Complete!');
    console.log('='.repeat(50));
    console.log(`Total batches checked: ${batches.length}`);
    console.log(`Batches affected: ${batchesAffected}`);
    console.log(`Total registrations fixed: ${totalFixed}`);
    console.log('');

    // Verification
    console.log('Running verification...');
    const remainingIssues = await Batch.aggregate([
      {
        $match: {
          payment_status: PAYMENT_STATUS.COMPLETED,
          status: { $in: [BATCH_STATUS.SUBMITTED, BATCH_STATUS.CONFIRMED] }
        }
      },
      {
        $lookup: {
          from: 'registrations',
          localField: '_id',
          foreignField: 'batch_id',
          as: 'registrations'
        }
      },
      {
        $project: {
          batch_reference: 1,
          unconfirmed_count: {
            $size: {
              $filter: {
                input: '$registrations',
                cond: { $eq: ['$$this.status', 'registered'] }
              }
            }
          }
        }
      },
      {
        $match: { unconfirmed_count: { $gt: 0 } }
      }
    ]);

    if (remainingIssues.length === 0) {
      console.log('✓ Verification passed - No remaining issues found');
    } else {
      console.log(`⚠ Warning: ${remainingIssues.length} batches still have unconfirmed registrations:`);
      remainingIssues.forEach(batch => {
        console.log(`  - ${batch.batch_reference}: ${batch.unconfirmed_count} unconfirmed`);
      });
    }

    await mongoose.connection.close();
    console.log('');
    console.log('Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('='.repeat(50));
    console.error('Migration Failed!');
    console.error('='.repeat(50));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

// Run migration
console.log('');
console.log('='.repeat(50));
console.log('Registration Status Migration');
console.log('='.repeat(50));
console.log('');

migrateRegistrationStatus();

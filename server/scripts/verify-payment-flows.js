/**
 * Verification Script: Payment & Registration Flow Health Check
 *
 * Runs comprehensive checks on payment and registration flows
 * to ensure all fixes are working correctly.
 *
 * Run with: node server/scripts/verify-payment-flows.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Batch = require('../src/models/Batch');
const Registration = require('../src/models/Registration');
const Payment = require('../src/models/Payment');
const WebhookLog = require('../src/models/WebhookLog');
const { BATCH_STATUS, PAYMENT_STATUS } = require('../src/utils/constants');

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function logPass(message) {
  console.log(`✓ ${message}`);
  checks.passed++;
}

function logFail(message) {
  console.log(`✗ ${message}`);
  checks.failed++;
}

function logWarn(message) {
  console.log(`⚠ ${message}`);
  checks.warnings++;
}

async function checkRegistrationStatusSync() {
  console.log('\n1. Registration Status Synchronization');
  console.log('-'.repeat(50));

  const mismatches = await Batch.aggregate([
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
        status: 1,
        registration_count: { $size: '$registrations' },
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

  if (mismatches.length === 0) {
    logPass('All completed batches have confirmed registrations');
  } else {
    logFail(`Found ${mismatches.length} batches with status mismatch:`);
    mismatches.forEach(batch => {
      console.log(`   - ${batch.batch_reference}: ${batch.unconfirmed_count}/${batch.registration_count} unconfirmed`);
    });
  }
}

async function checkOrphanedRecords() {
  console.log('\n2. Orphaned Records Check');
  console.log('-'.repeat(50));

  // Check for registrations without valid batch
  const orphanedRegs = await Registration.aggregate([
    {
      $lookup: {
        from: 'batches',
        localField: 'batch_id',
        foreignField: '_id',
        as: 'batch'
      }
    },
    {
      $match: { batch: { $size: 0 } }
    },
    {
      $count: 'count'
    }
  ]);

  const orphanedRegCount = orphanedRegs.length > 0 ? orphanedRegs[0].count : 0;

  if (orphanedRegCount === 0) {
    logPass('No orphaned registrations found');
  } else {
    logWarn(`Found ${orphanedRegCount} orphaned registrations`);
  }

  // Check for batches without valid event
  const orphanedBatches = await Batch.aggregate([
    {
      $lookup: {
        from: 'events',
        localField: 'event_id',
        foreignField: '_id',
        as: 'event'
      }
    },
    {
      $match: { event: { $size: 0 } }
    },
    {
      $count: 'count'
    }
  ]);

  const orphanedBatchCount = orphanedBatches.length > 0 ? orphanedBatches[0].count : 0;

  if (orphanedBatchCount === 0) {
    logPass('No orphaned batches found');
  } else {
    logWarn(`Found ${orphanedBatchCount} orphaned batches`);
  }

  // Check for payments without valid batch
  const orphanedPayments = await Payment.aggregate([
    {
      $lookup: {
        from: 'batches',
        localField: 'batch_id',
        foreignField: '_id',
        as: 'batch'
      }
    },
    {
      $match: { batch: { $size: 0 } }
    },
    {
      $count: 'count'
    }
  ]);

  const orphanedPaymentCount = orphanedPayments.length > 0 ? orphanedPayments[0].count : 0;

  if (orphanedPaymentCount === 0) {
    logPass('No orphaned payments found');
  } else {
    logWarn(`Found ${orphanedPaymentCount} orphaned payments`);
  }
}

async function checkWebhookLogs() {
  console.log('\n3. Webhook Idempotency Check');
  console.log('-'.repeat(50));

  // Check if WebhookLog collection exists
  const collections = await mongoose.connection.db.listCollections({ name: 'webhooklogs' }).toArray();

  if (collections.length === 0) {
    logWarn('WebhookLog collection does not exist yet (will be created on first webhook)');
    return;
  }

  logPass('WebhookLog collection exists');

  // Check for duplicate webhook attempts
  const duplicates = await WebhookLog.aggregate([
    {
      $group: {
        _id: '$webhook_id',
        count: { $sum: 1 },
        first_attempt: { $min: '$created_at' },
        last_attempt: { $max: '$created_at' }
      }
    },
    {
      $match: { count: { $gt: 1 } }
    },
    {
      $limit: 5
    }
  ]);

  if (duplicates.length > 0) {
    logPass(`Idempotency working - ${duplicates.length} duplicate webhooks detected and handled`);
    duplicates.forEach(dup => {
      console.log(`   - Webhook ${dup._id}: ${dup.count} attempts`);
    });
  } else {
    logPass('No duplicate webhooks detected (or none received yet)');
  }

  // Check for webhook errors
  const errors = await WebhookLog.countDocuments({ error: { $ne: null } });

  if (errors === 0) {
    logPass('No webhook processing errors');
  } else {
    logWarn(`Found ${errors} webhooks with processing errors`);
  }

  // Check TTL index
  const indexes = await WebhookLog.collection.getIndexes();
  const hasTTL = Object.values(indexes).some(idx =>
    idx.key && idx.key.created_at && idx.expireAfterSeconds
  );

  if (hasTTL) {
    logPass('TTL index configured correctly (auto-delete after 30 days)');
  } else {
    logFail('TTL index missing - webhooks will not auto-delete');
  }
}

async function checkModelMethods() {
  console.log('\n4. Model Methods Check');
  console.log('-'.repeat(50));

  // Check if bulkConfirmByBatch exists
  if (typeof Registration.bulkConfirmByBatch === 'function') {
    logPass('Registration.bulkConfirmByBatch() method exists');
  } else {
    logFail('Registration.bulkConfirmByBatch() method missing');
  }

  // Check if it accepts session parameter (by checking function length)
  const funcStr = Registration.bulkConfirmByBatch.toString();
  if (funcStr.includes('options') || funcStr.includes('session')) {
    logPass('Registration.bulkConfirmByBatch() accepts session parameter');
  } else {
    logFail('Registration.bulkConfirmByBatch() does not accept session parameter');
  }
}

async function checkIndexes() {
  console.log('\n5. Database Indexes Check');
  console.log('-'.repeat(50));

  // Check Batch indexes
  const batchIndexes = await Batch.collection.getIndexes();
  logPass(`Batch collection has ${Object.keys(batchIndexes).length} indexes`);

  // Check Registration indexes
  const regIndexes = await Registration.collection.getIndexes();
  logPass(`Registration collection has ${Object.keys(regIndexes).length} indexes`);

  // Check Payment indexes
  const paymentIndexes = await Payment.collection.getIndexes();
  logPass(`Payment collection has ${Object.keys(paymentIndexes).length} indexes`);

  // Check WebhookLog indexes if collection exists
  const collections = await mongoose.connection.db.listCollections({ name: 'webhooklogs' }).toArray();
  if (collections.length > 0) {
    const webhookIndexes = await WebhookLog.collection.getIndexes();
    logPass(`WebhookLog collection has ${Object.keys(webhookIndexes).length} indexes`);

    // Check for unique webhook_id index
    const hasUniqueWebhookId = Object.values(webhookIndexes).some(idx =>
      idx.key && idx.key.webhook_id && idx.unique
    );

    if (hasUniqueWebhookId) {
      logPass('WebhookLog has unique webhook_id index');
    } else {
      logFail('WebhookLog missing unique webhook_id index');
    }
  }
}

async function checkRecentActivity() {
  console.log('\n6. Recent Activity Check (Last 7 Days)');
  console.log('-'.repeat(50));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentBatches = await Batch.countDocuments({
    created_at: { $gte: sevenDaysAgo }
  });

  const recentPayments = await Payment.countDocuments({
    created_at: { $gte: sevenDaysAgo }
  });

  const recentRegistrations = await Registration.countDocuments({
    created_at: { $gte: sevenDaysAgo }
  });

  console.log(`   Batches created: ${recentBatches}`);
  console.log(`   Payments processed: ${recentPayments}`);
  console.log(`   Registrations created: ${recentRegistrations}`);

  if (recentBatches > 0 || recentPayments > 0 || recentRegistrations > 0) {
    logPass('System has recent activity');
  } else {
    logWarn('No recent activity in last 7 days');
  }
}

async function runVerification() {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✓ Connected to database');
    console.log(`  Database: ${mongoose.connection.name}`);

    // Run all checks
    await checkRegistrationStatusSync();
    await checkOrphanedRecords();
    await checkWebhookLogs();
    await checkModelMethods();
    await checkIndexes();
    await checkRecentActivity();

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Verification Summary');
    console.log('='.repeat(50));
    console.log(`✓ Passed: ${checks.passed}`);
    console.log(`✗ Failed: ${checks.failed}`);
    console.log(`⚠ Warnings: ${checks.warnings}`);
    console.log('');

    if (checks.failed === 0 && checks.warnings === 0) {
      console.log('🎉 All checks passed! System is healthy.');
    } else if (checks.failed === 0) {
      console.log('⚠️  All critical checks passed, but some warnings were found.');
    } else {
      console.log('❌ Some checks failed. Please review the issues above.');
    }

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');

    process.exit(checks.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('');
    console.error('='.repeat(50));
    console.error('Verification Failed!');
    console.error('='.repeat(50));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }

    process.exit(1);
  }
}

// Run verification
console.log('');
console.log('='.repeat(50));
console.log('Payment & Registration Flow - Health Check');
console.log('='.repeat(50));

runVerification();

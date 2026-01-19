# Payment & Registration Flow Fixes - Implementation Summary

## Problem Fixed
Schools couldn't see registered students after payment completion due to registration status never updating from REGISTERED to CONFIRMED.

## Changes Implemented

### Phase 1: Critical Registration Sync ✅
**Issue**: `Registration.bulkConfirmByBatch()` method existed but was never called.

**Files Modified**:
- `server/src/controllers/payment/payment.controller.js` (lines 6, 179, 301, 614)
- `server/src/controllers/payment/webhook.controller.js` (lines 4, 140, 261, 302, 483)

**Impact**: Registrations now transition REGISTERED → CONFIRMED when batch payment completes.

### Phase 2: MongoDB Transactions ✅
**Issue**: No atomicity - risk of orphaned registrations/batches.

**Files Modified**:
- `server/src/models/Registration.js` (line 339) - Accept session parameter
- `server/src/controllers/batch/bulkRegistration.controller.js` (lines 4, 238-323, 425-453)
- `server/src/controllers/payment/payment.controller.js` (lines 4, 172-282, 311-422, 640-729)

**Impact**: All batch/payment operations are atomic with rollback on failure.

### Phase 3: Data Integrity Checks ✅
**Issue**: Cascading deletes could orphan data.

**Files Modified**:
- `server/src/controllers/batch/bulkRegistration.controller.js` (lines 8, 427-433)
- `server/src/controllers/admin/adminEvent.controller.js` (lines 323-333)
- `server/src/models/Batch.js` (lines 506-522)

**Impact**: Cannot delete events with batches, batches with payments.

### Phase 4: Webhook Idempotency ✅
**Issue**: Duplicate webhooks could process payments twice.

**Files Created**:
- `server/src/models/WebhookLog.js` (new file)

**Files Modified**:
- `server/src/controllers/payment/webhook.controller.js` (lines 5, 35-50, 72-86, 110-125, 150-164)

**Impact**: Duplicate webhooks ignored, all webhook attempts logged (30-day TTL).

## Testing Guide

### 1. Registration Sync Test
```bash
# Create batch via CSV upload
# Complete payment via Razorpay/Stripe
# Query database to verify registrations are CONFIRMED

# MongoDB query:
db.batches.findOne({ batch_reference: "YOUR_BATCH_REF" })
db.registrations.find({ batch_id: ObjectId("BATCH_ID") })
# All registrations should have status: "confirmed"
```

### 2. Transaction Rollback Test
```javascript
// Simulate error by temporarily modifying code
// In payment.controller.js after Registration.bulkConfirmByBatch():
throw new Error("Test rollback");

// Expected: Payment, batch, registrations all unchanged
// Verify no partial updates occurred
```

### 3. Data Integrity Test
```bash
# Test 1: Try delete batch with payment
curl -X DELETE /api/v1/batches/BATCH_WITH_PAYMENT
# Expected: 400 error - "Cannot delete batch with payment records"

# Test 2: Try delete event with batches
curl -X DELETE /api/v1/admin/events/EVENT_WITH_BATCHES
# Expected: 400 error - "Cannot delete event with X batch(es)"
```

### 4. Webhook Idempotency Test
```bash
# Send same webhook twice
curl -X POST http://localhost:5000/api/v1/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: SIGNATURE" \
  -d '{"id": "unique_webhook_id", "event": "payment.captured", ...}'

# Send again with same ID
# Expected: 200 OK, "Already processed"

# Check WebhookLog collection:
db.webhooklogs.find({ webhook_id: "unique_webhook_id" })
# Should show processed: true
```

## Migration Script for Existing Data

Run this to fix existing batches with completed payments but unconfirmed registrations:

```javascript
// server/scripts/migrate-registration-status.js

const mongoose = require('mongoose');
const Batch = require('../src/models/Batch');
const Registration = require('../src/models/Registration');
const { BATCH_STATUS, PAYMENT_STATUS } = require('../src/utils/constants');

async function migrateRegistrationStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find all completed batches
    const batches = await Batch.find({
      payment_status: PAYMENT_STATUS.COMPLETED,
      status: { $in: [BATCH_STATUS.SUBMITTED, BATCH_STATUS.CONFIRMED] }
    });

    console.log(`Found ${batches.length} completed batches`);

    let totalFixed = 0;

    for (const batch of batches) {
      const result = await Registration.updateMany(
        { batch_id: batch._id, status: 'registered' },
        { $set: { status: 'confirmed' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`Batch ${batch.batch_reference}: Fixed ${result.modifiedCount} registrations`);
        totalFixed += result.modifiedCount;
      }
    }

    console.log(`\nMigration complete! Fixed ${totalFixed} registrations across ${batches.length} batches`);
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateRegistrationStatus();
```

## Verification Queries

### Check for Status Mismatches
```javascript
// Find batches with completed payment but unconfirmed registrations
db.batches.aggregate([
  {
    $match: {
      payment_status: 'completed',
      status: { $in: ['submitted', 'confirmed'] }
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
```

### Check Webhook Logs
```javascript
// View recent webhook processing
db.webhooklogs.find()
  .sort({ created_at: -1 })
  .limit(10);

// Check for duplicate attempts
db.webhooklogs.aggregate([
  {
    $group: {
      _id: '$webhook_id',
      count: { $sum: 1 },
      attempts: { $push: { processed: '$processed', created_at: '$created_at' } }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]);
```

## Performance Considerations

### Transaction Impact
- MongoDB transactions add ~10-50ms overhead per operation
- Acceptable for payment operations (security > speed)
- No impact on read operations

### WebhookLog TTL
- Auto-deletes after 30 days via MongoDB TTL index
- Minimal storage impact (~1KB per webhook)
- 10,000 webhooks/month = ~10MB storage

### Index Performance
```javascript
// Verify indexes exist
db.webhooklogs.getIndexes();

// Should include:
// - { webhook_id: 1 } (unique)
// - { gateway: 1, event_type: 1, created_at: -1 }
// - { webhook_id: 1, processed: 1 }
// - { created_at: 1 } with expireAfterSeconds: 2592000
```

## Rollback Plan

If issues occur, revert in this order:

### Phase 4 Rollback (Webhook Idempotency)
```javascript
// Remove idempotency checks in webhook.controller.js
// Delete WebhookLog model
// Webhooks will process normally but without duplicate detection
```

### Phase 3 Rollback (Data Integrity)
```javascript
// Remove payment checks from bulkRegistration.controller.js:427-433
// Remove batch checks from adminEvent.controller.js:323-333
// Remove pre-delete hook from Batch.js:514-522
```

### Phase 2 Rollback (Transactions)
```javascript
// Remove all session.startTransaction() blocks
// Revert to direct save() calls without { session }
// Remove mongoose import from payment.controller.js and bulkRegistration.controller.js
```

### Phase 1 Rollback (Registration Sync)
```javascript
// Remove all Registration.bulkConfirmByBatch() calls
// Registrations will remain in REGISTERED status (original bug returns)
```

## Monitoring

Add these alerts to your monitoring system:

1. **Registration Status Mismatch**
   - Alert if batch is CONFIRMED but has REGISTERED registrations
   - Check frequency: Every 30 minutes

2. **Webhook Processing Failures**
   - Alert if webhookLog.error is not null
   - Check frequency: Real-time

3. **Transaction Rollbacks**
   - Monitor logs for "transaction failed"
   - Alert on >5 rollbacks/hour

4. **Orphaned Records**
   - Check for registrations without valid batch_id
   - Check frequency: Daily

## Deployment Checklist

- [ ] Backup database before deployment
- [ ] Deploy code changes
- [ ] Run migration script for existing data
- [ ] Verify indexes created (WebhookLog)
- [ ] Test one payment end-to-end
- [ ] Send test webhook and verify idempotency
- [ ] Monitor logs for errors (first 24 hours)
- [ ] Run verification queries after 1 week

## Support

For issues or questions:
- Check logs: `server/logs/`
- Database queries in "Verification Queries" section above
- Rollback plan if critical issues occur

# Deployment Guide - Payment & Registration Flow Fixes

## Pre-Deployment Checklist

- [ ] Review all code changes in pull request
- [ ] Backup production database
- [ ] Test in staging environment first
- [ ] Ensure MongoDB version supports transactions (4.0+)
- [ ] Notify team of deployment window

## Deployment Steps

### 1. Database Backup
```bash
# Create full database backup
mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d_%H%M%S)
```

### 2. Deploy Code

#### Option A: Manual Deployment
```bash
# Pull latest changes
git pull origin main

# Install dependencies (if package.json changed)
cd server && npm install

# Restart server
pm2 restart bulk-registration-api
# or
systemctl restart bulk-registration-server
```

#### Option B: Docker Deployment
```bash
# Build new image
docker build -t bulk-registration:latest .

# Stop old container
docker stop bulk-registration

# Start new container
docker run -d --name bulk-registration \
  --env-file .env \
  -p 5000:5000 \
  bulk-registration:latest
```

### 3. Run Migration Script
```bash
# Navigate to server directory
cd server

# Run migration to fix existing data
node scripts/migrate-registration-status.js
```

Expected output:
```
✓ Connected to database
Found 45 completed batches to check

✓ Batch ABC-001: Fixed 25 registrations
✓ Batch ABC-002: Fixed 30 registrations
...

Migration Complete!
Total registrations fixed: 1,250
```

### 4. Verify Deployment
```bash
# Run health check script
node scripts/verify-payment-flows.js
```

Expected output:
```
✓ All completed batches have confirmed registrations
✓ No orphaned registrations found
✓ No orphaned batches found
✓ WebhookLog collection exists
✓ All checks passed! System is healthy.
```

### 5. Smoke Tests

#### Test 1: Create New Batch
```bash
# 1. Login as school
# 2. Upload CSV file
# 3. Verify batch created
# 4. Check registrations are in REGISTERED status

curl -X GET http://localhost:5000/api/v1/batches/BATCH_REF \
  -H "Authorization: Bearer TOKEN"
```

#### Test 2: Complete Payment
```bash
# 1. Initiate payment
# 2. Complete payment (use test gateway)
# 3. Verify batch status → SUBMITTED
# 4. Verify registrations → CONFIRMED

# Check registration status
curl -X GET http://localhost:5000/api/v1/batches/BATCH_REF \
  -H "Authorization: Bearer TOKEN" | jq '.data.batch.registration_ids[].status'
```

#### Test 3: Webhook Idempotency
```bash
# Send duplicate webhook (use ngrok for local testing)
curl -X POST https://your-domain.com/api/v1/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: SIGNATURE" \
  -d @test-webhook.json

# Send again - should return "Already processed"
```

### 6. Monitor Logs
```bash
# Tail application logs
tail -f server/logs/combined.log

# Watch for errors
grep -i "error\|failed\|rollback" server/logs/combined.log

# Check transaction logs
grep -i "transaction" server/logs/combined.log
```

## Post-Deployment Monitoring

### First Hour
- [ ] Check error logs every 15 minutes
- [ ] Monitor server CPU/memory usage
- [ ] Verify no failed payment transactions
- [ ] Check webhook processing (if any webhooks received)

### First Day
- [ ] Run verification script: `node scripts/verify-payment-flows.js`
- [ ] Check for registration status mismatches
- [ ] Review webhook logs for duplicates
- [ ] Verify no orphaned records created

### First Week
- [ ] Run verification script daily
- [ ] Monitor transaction rollback frequency
- [ ] Check webhook log size (should auto-delete after 30 days)
- [ ] Verify all new batches have confirmed registrations after payment

## MongoDB Queries for Monitoring

### Check Registration Status Health
```javascript
// Run in MongoDB shell
use your_database;

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
      unconfirmed: {
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
    $match: { unconfirmed: { $gt: 0 } }
  }
]);
```

### Check Webhook Processing
```javascript
// Recent webhooks
db.webhooklogs.find()
  .sort({ created_at: -1 })
  .limit(20);

// Failed webhooks
db.webhooklogs.find({ error: { $ne: null } })
  .sort({ created_at: -1 });

// Duplicate attempts
db.webhooklogs.aggregate([
  {
    $group: {
      _id: '$webhook_id',
      count: { $sum: 1 }
    }
  },
  {
    $match: { count: { $gt: 1 } }
  }
]);
```

### Check Transaction Health
```bash
# Check application logs for transaction failures
grep "transaction failed\|abortTransaction" server/logs/combined.log | wc -l

# Should be 0 or very low number
```

## Rollback Procedure

If critical issues occur:

### Quick Rollback (Code Only)
```bash
# Revert to previous code version
git revert HEAD
git push origin main

# Redeploy
pm2 restart bulk-registration-api
```

### Full Rollback (Code + Database)
```bash
# 1. Stop application
pm2 stop bulk-registration-api

# 2. Restore database backup
mongorestore --uri="mongodb://..." --drop /backup/TIMESTAMP

# 3. Revert code
git revert HEAD
git push origin main

# 4. Restart application
pm2 restart bulk-registration-api
```

## Troubleshooting

### Issue: Registrations Still REGISTERED After Payment

**Check:**
```javascript
// Verify Registration.bulkConfirmByBatch was called
grep "bulkConfirmByBatch" server/logs/combined.log
```

**Fix:**
```bash
# Run migration script again
node scripts/migrate-registration-status.js
```

### Issue: Transaction Failures

**Check:**
```bash
# View transaction errors
grep "transaction.*failed" server/logs/combined.log -A 5
```

**Common Causes:**
- MongoDB version < 4.0 (no transaction support)
- Replica set not configured
- Network timeout during transaction

**Fix:**
- Ensure MongoDB replica set is configured
- Increase transaction timeout in mongoose connection options

### Issue: Webhook Processing Slow

**Check:**
```javascript
// Count webhook logs
db.webhooklogs.count();

// Should be < 100k (30 days * ~3k webhooks/day)
```

**Fix:**
- Verify TTL index is working: `db.webhooklogs.getIndexes()`
- Manually delete old logs: `db.webhooklogs.deleteMany({ created_at: { $lt: new Date(Date.now() - 30*24*60*60*1000) } })`

### Issue: Duplicate Payments Processed

**Check:**
```javascript
// Find duplicate webhook processing
db.webhooklogs.find({ webhook_id: "WEBHOOK_ID" });
```

**Fix:**
- Check if webhook idempotency is active
- Verify WebhookLog model is imported in webhook.controller.js
- Check for errors in webhook log

## Performance Impact

### Expected Changes
- **Batch creation**: +20-50ms (transaction overhead)
- **Payment verification**: +30-80ms (transaction + registration update)
- **Webhook processing**: +10-20ms (idempotency check)
- **Memory usage**: +5-10MB (webhook logs)
- **Storage**: ~1KB per webhook (~30MB/month for 1000 webhooks/day)

### Optimization Tips
- Monitor MongoDB connection pool size
- Increase if transactions are queuing
- Consider adding read replicas for heavy loads

## Support Contacts

- **Technical Issues**: [Your team email]
- **Database Issues**: [DBA email]
- **Emergency Rollback**: [On-call engineer]

## Success Criteria

Deployment is successful when:
- ✅ All verification script checks pass
- ✅ At least 3 test payments complete successfully
- ✅ Registrations change to CONFIRMED after payment
- ✅ No transaction rollback errors in logs
- ✅ Webhook idempotency working (test with duplicate)
- ✅ No performance degradation (< 100ms added latency)
- ✅ Migration script fixes all existing data
- ✅ Zero orphaned records created

## Timeline

- **Pre-deployment**: 30 minutes (backup, review)
- **Deployment**: 15 minutes (code deploy, restart)
- **Migration**: 5-30 minutes (depends on data volume)
- **Verification**: 10 minutes (smoke tests)
- **Monitoring**: First 24 hours critical

**Total estimated time**: 1-2 hours

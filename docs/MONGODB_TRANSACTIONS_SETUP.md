# MongoDB Transactions Setup Guide

## Current Status

The system now supports **both standalone and replica set MongoDB**:

- ✅ **With Replica Set**: Full transaction support with automatic rollback
- ✅ **Without Replica Set (Standalone)**: Graceful fallback to non-transactional mode

## How It Works

The code automatically detects if MongoDB supports transactions:

```javascript
// Attempts to start transaction
const { session, useTransaction } = await startTransaction();

if (useTransaction) {
  // Use transactions (replica set)
  await Model.create([data], { session });
} else {
  // Fallback mode (standalone)
  await Model.create(data);
}
```

**Warning in logs** if transactions not supported:
```
Transactions not supported (requires replica set), using fallback mode
```

## Why Transactions Failed

MongoDB transactions require:
1. MongoDB version 4.0+
2. **Replica set configuration** (even for single server)

If you're running standalone MongoDB, transactions will automatically fall back to non-transactional mode.

## Enable Transactions (Optional but Recommended)

### For Development (Single Node Replica Set)

1. **Stop MongoDB**:
   ```bash
   # Windows
   net stop MongoDB

   # Linux/Mac
   sudo systemctl stop mongod
   ```

2. **Edit mongod.conf**:
   ```yaml
   # Location:
   # Windows: C:\Program Files\MongoDB\Server\7.0\bin\mongod.cfg
   # Linux: /etc/mongod.conf
   # Mac: /usr/local/etc/mongod.conf

   replication:
     replSetName: "rs0"
   ```

3. **Start MongoDB**:
   ```bash
   # Windows
   net start MongoDB

   # Linux/Mac
   sudo systemctl start mongod
   ```

4. **Initialize Replica Set**:
   ```bash
   mongosh
   ```
   ```javascript
   rs.initiate({
     _id: "rs0",
     members: [
       { _id: 0, host: "localhost:27017" }
     ]
   })
   ```

5. **Verify**:
   ```javascript
   rs.status()
   // Should show "stateStr": "PRIMARY"
   ```

### For Docker

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7.0
    command: mongod --replSet rs0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  mongo-init-replica:
    image: mongo:7.0
    depends_on:
      - mongodb
    command: >
      mongosh --host mongodb:27017 --eval
      "rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongodb:27017' }] })"
    restart: "no"

volumes:
  mongodb_data:
```

### For Production

Use managed services (recommended):
- **MongoDB Atlas** (automatic replica set)
- **AWS DocumentDB** (compatible API)
- **Azure Cosmos DB** (MongoDB API)

Or setup 3-node replica set manually for high availability.

## Testing Transaction Support

Run this script to check:

```bash
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    console.log('✓ Transactions supported');
    await session.abortTransaction();
    session.endSession();
  } catch (error) {
    console.log('✗ Transactions not supported:', error.message);
  }
  process.exit(0);
});
"
```

## Impact Without Transactions

| Feature | With Transactions | Without Transactions |
|---------|-------------------|---------------------|
| Batch Creation | ✅ Atomic | ⚠️ Potential orphans on error |
| Payment Verification | ✅ Atomic | ⚠️ May leave inconsistent state |
| Batch Deletion | ✅ Atomic | ⚠️ May leave orphaned registrations |
| Data Consistency | ✅ Guaranteed | ⚠️ Best effort |
| Registration Sync | ✅ Works | ✅ Works |

**Note**: Registration sync (Phase 1) works in both modes. Transactions (Phase 2) provide additional safety.

## Recommendation

- **Development**: Use single-node replica set
- **Staging**: Use replica set
- **Production**: Use managed service or 3-node replica set

## Current System Status

Check your server logs for:
```
Transactions not supported, falling back to non-transactional mode
```

If you see this, the system is working but transactions are disabled.

## Troubleshooting

### Error: "Transaction numbers are only allowed on a replica set member"

**Solution**: Enable replica set (see above)

### Error: "Transaction support is not enabled"

**Solution**:
1. Ensure MongoDB 4.0+: `mongod --version`
2. Enable replica set in config
3. Initialize replica set: `rs.initiate()`

### Performance Impact

- **Replica Set**: +10-50ms per transaction
- **Standalone**: No overhead (no transactions)

For most applications, the safety of transactions is worth the minimal overhead.

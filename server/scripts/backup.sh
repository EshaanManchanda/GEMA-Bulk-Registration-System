#!/bin/bash

# MongoDB Backup Script for GEMA Events
# Run via cron: 0 2 * * * /path/to/backup.sh

# Configuration
BACKUP_DIR="/var/backups/mongodb"
MONGO_URI="${MONGODB_URI:-mongodb://localhost:27017/gema}"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Extract database name from URI
DB_NAME=$(echo "$MONGO_URI" | sed 's/.*\///' | sed 's/\?.*//')
if [ -z "$DB_NAME" ]; then
  DB_NAME="gema"
fi

# Backup filename
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.gz"

echo "Starting MongoDB backup..."
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Perform backup using mongodump
if command -v mongodump &> /dev/null; then
  mongodump --uri="$MONGO_URI" --archive="$BACKUP_FILE" --gzip

  if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"

    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $SIZE"
  else
    echo "ERROR: Backup failed!"
    exit 1
  fi
else
  echo "ERROR: mongodump not found. Install MongoDB tools."
  exit 1
fi

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.gz" -mtime +$RETENTION_DAYS -delete
echo "Cleanup completed."

# List recent backups
echo ""
echo "Recent backups:"
ls -lh "$BACKUP_DIR"/*.gz 2>/dev/null | tail -5

echo ""
echo "Backup process finished."

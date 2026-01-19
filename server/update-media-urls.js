/**
 * Script to update existing media records to use proxy URLs
 * Run: node update-media-urls.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const updateMediaUrls = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gema');
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const mediaCollection = db.collection('media');

    // Get BASE_URL from env or default
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    // Update all media records to use proxy URL format
    const result = await mediaCollection.updateMany(
      {}, // Update all records
      [
        {
          $set: {
            file_url: {
              $concat: [baseUrl, '/api/v1/media/serve/', { $toString: '$_id' }]
            }
          }
        }
      ]
    );

    console.log(`✓ Updated ${result.modifiedCount} media record(s)`);
    console.log(`  New URL format: ${baseUrl}/api/v1/media/serve/{id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error updating media URLs:', error);
    process.exit(1);
  }
};

updateMediaUrls();

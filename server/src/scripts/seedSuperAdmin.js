/**
 * Seed Script: Create First SuperAdmin
 * Run: node src/scripts/seedSuperAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { ROLES } = require('../utils/constants');

const SUPER_ADMIN_DATA = {
  name: 'Eshaan Manchanda',
  email: 'eshaanmanchanda01@gmail.com',
  password_hash: 'Eshaan123@@',  // Will be hashed by pre-save middleware
  role: ROLES.SUPER_ADMIN,
  is_active: true
};

async function seedSuperAdmin() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('ERROR: MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: SUPER_ADMIN_DATA.email });
    if (existingAdmin) {
      console.log(`Admin with email ${SUPER_ADMIN_DATA.email} already exists`);
      console.log('Existing admin ID:', existingAdmin._id);
      process.exit(0);
    }

    // Create SuperAdmin
    const superAdmin = new Admin(SUPER_ADMIN_DATA);
    await superAdmin.save();

    console.log('\n✓ SuperAdmin created successfully!');
    console.log('----------------------------------');
    console.log('Name:', superAdmin.name);
    console.log('Email:', superAdmin.email);
    console.log('Role:', superAdmin.role);
    console.log('ID:', superAdmin._id);
    console.log('----------------------------------');
    console.log('\nYou can now login at /api/v1/auth/admin/login');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding SuperAdmin:', error.message);
    process.exit(1);
  }
}

seedSuperAdmin();

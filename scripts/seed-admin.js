#!/usr/bin/env node

/**
 * Enhanced Admin Seeder
 * Creates admin accounts with multiple modes: ENV, CLI, Config, Interactive
 *
 * Usage:
 *   ENV mode:          node scripts/seed-admin.js
 *   CLI mode:          node scripts/seed-admin.js --mode cli --email admin@ex.com --password Pass123! --name "Admin" --role admin
 *   Config file mode:  node scripts/seed-admin.js --mode config --config ./admin-config.json
 *   Interactive mode:  node scripts/seed-admin.js --mode interactive
 *   Help:              node scripts/seed-admin.js --help
 */

require('../server/node_modules/dotenv').config({ path: './server/.env' });
const mongoose = require('../server/node_modules/mongoose');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Admin = require('../server/src/models/Admin');
const logger = require('../server/src/utils/logger');

// ============================================
// VALIDATION HELPERS
// ============================================

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  if (!hasUpper || !hasLower || !hasNumber) {
    return {
      valid: false,
      message: 'Password should contain uppercase, lowercase, and numbers for better security'
    };
  }

  return { valid: true };
}

function validateRole(role) {
  const validRoles = ['super_admin', 'admin', 'moderator'];
  return validRoles.includes(role);
}

// ============================================
// CLI ARGUMENT PARSER
// ============================================

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { mode: 'env' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = args[i + 1];

      if (value && !value.startsWith('--')) {
        parsed[key] = value;
        i++;
      } else if (key === 'mode' && !value) {
        console.error(`Error: --${key} requires a value`);
        process.exit(1);
      }
    }
  }

  return parsed;
}

function showHelp() {
  console.log(`
========================================
GEMA Admin Seeder - Help
========================================

MODES:

1. ENV Mode (default):
   Uses environment variables from .env file
   Usage: node scripts/seed-admin.js
   Required env vars: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME

2. CLI Mode:
   Create single admin via command-line arguments
   Usage: node scripts/seed-admin.js --mode cli --email <email> --password <password> --name "<name>" --role <role>

   Flags:
     --email <email>       Admin email address (required)
     --password <password> Admin password (required, min 8 chars)
     --name "<name>"       Admin full name (required, use quotes)
     --role <role>         Admin role: super_admin, admin, moderator (required)
     --phone <phone>       Phone number (optional)

   Example:
     node scripts/seed-admin.js --mode cli --email admin@gema.com --password SecurePass123! --name "Admin User" --role admin

3. Config File Mode:
   Create multiple admins from JSON config file
   Usage: node scripts/seed-admin.js --mode config --config <path-to-json>

   Example:
     node scripts/seed-admin.js --mode config --config ./scripts/admin-config.json

   See scripts/admin-config.example.json for format

4. Interactive Mode:
   Step-by-step wizard to create one or more admins
   Usage: node scripts/seed-admin.js --mode interactive

   Example:
     node scripts/seed-admin.js --mode interactive

VALID ROLES:
  - super_admin: Full system access, can create other admins
  - admin: Manage events, schools, payments
  - moderator: Limited permissions

PASSWORD REQUIREMENTS:
  - Minimum 8 characters
  - Recommended: Include uppercase, lowercase, and numbers

========================================
  `);
}

// ============================================
// MODE 1: ENV MODE
// ============================================

async function seedFromEnv() {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gema-events.com';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const ADMIN_NAME = process.env.ADMIN_NAME || 'GEMA Administrator';

  console.log('Running in ENV mode...\n');

  // Validate email
  if (!validateEmail(ADMIN_EMAIL)) {
    throw new Error(`Invalid email format: ${ADMIN_EMAIL}`);
  }

  // Check password strength
  const passwordCheck = validatePassword(ADMIN_PASSWORD);
  if (!passwordCheck.valid) {
    console.warn(`⚠️  Warning: ${passwordCheck.message}`);
  }

  // Check if admin already exists
  const existingAdmin = await Admin.findByEmail(ADMIN_EMAIL);

  if (existingAdmin) {
    console.log('⚠  Admin user already exists:');
    console.log(`  Email: ${existingAdmin.email}`);
    console.log(`  Role: ${existingAdmin.role}`);
    console.log(`  Created: ${existingAdmin.created_at}\n`);

    // Ask if user wants to reset password
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise(resolve => {
      rl.question('Do you want to reset the password? (yes/no): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      existingAdmin.password_hash = ADMIN_PASSWORD;
      await existingAdmin.save();
      console.log('\n✓ Admin password reset successfully!');
      console.log(`  Email: ${ADMIN_EMAIL}`);
      console.log(`  Password: ${ADMIN_PASSWORD}\n`);
      console.log('⚠  Please change this password after first login!');
    } else {
      console.log('\nNo changes made.');
    }
  } else {
    // Create new super admin
    const admin = await Admin.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password_hash: ADMIN_PASSWORD,
      role: 'super_admin',
      is_active: true
    });

    console.log('✓ Super admin created successfully!\n');
    console.log('=================================');
    console.log('Admin Login Credentials:');
    console.log('=================================');
    console.log(`Email:    ${admin.email}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role:     ${admin.role}`);
    console.log('=================================\n');
    console.log('⚠  IMPORTANT: Change this password after first login!');
    console.log('⚠  Keep these credentials secure!\n');

    logger.info(`Super admin created: ${admin.email}`);
  }
}

// ============================================
// MODE 2: CLI MODE
// ============================================

async function seedFromCli(args) {
  console.log('Running in CLI mode...\n');

  // Validate required arguments
  const required = ['email', 'password', 'name', 'role'];
  const missing = required.filter(key => !args[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required arguments: ${missing.join(', ')}\nUse --help for usage information`);
  }

  const { email, password, name, role, phone } = args;

  // Validate email
  if (!validateEmail(email)) {
    throw new Error(`Invalid email format: ${email}`);
  }

  // Validate password
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    console.warn(`⚠️  Warning: ${passwordCheck.message}`);
  }

  // Validate role
  if (!validateRole(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of: super_admin, admin, moderator`);
  }

  // Check if admin already exists
  const existingAdmin = await Admin.findByEmail(email);

  if (existingAdmin) {
    throw new Error(`Admin with email ${email} already exists. Use ENV mode for password reset.`);
  }

  // Create admin
  const adminData = {
    name,
    email,
    password_hash: password,
    role,
    is_active: true
  };

  if (phone) {
    adminData.phone = phone;
  }

  const admin = await Admin.create(adminData);

  console.log('✓ Admin created successfully!\n');
  console.log('=================================');
  console.log('Admin Details:');
  console.log('=================================');
  console.log(`Name:     ${admin.name}`);
  console.log(`Email:    ${admin.email}`);
  console.log(`Role:     ${admin.role}`);
  if (phone) console.log(`Phone:    ${admin.phone}`);
  console.log('=================================\n');

  logger.info(`Admin created via CLI: ${admin.email} (${admin.role})`);
}

// ============================================
// MODE 3: CONFIG FILE MODE
// ============================================

async function seedFromConfig(args) {
  console.log('Running in Config File mode...\n');

  const configPath = args.config;

  if (!configPath) {
    throw new Error('--config parameter is required for config mode\nUsage: --mode config --config ./admin-config.json');
  }

  // Resolve path
  const fullPath = path.resolve(process.cwd(), configPath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Config file not found: ${fullPath}\nSee scripts/admin-config.example.json for format`);
  }

  // Read and parse JSON
  let config;
  try {
    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    config = JSON.parse(fileContent);
  } catch (error) {
    throw new Error(`Failed to parse JSON config file: ${error.message}`);
  }

  // Validate config structure
  if (!config.admins || !Array.isArray(config.admins)) {
    throw new Error('Config file must contain an "admins" array');
  }

  if (config.admins.length === 0) {
    throw new Error('Config file contains no admins to create');
  }

  console.log(`Found ${config.admins.length} admin(s) in config file\n`);

  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  // Process each admin
  for (const [index, adminData] of config.admins.entries()) {
    const adminNum = index + 1;
    console.log(`Processing admin ${adminNum}/${config.admins.length}...`);

    try {
      // Validate required fields
      const required = ['email', 'password', 'name', 'role'];
      const missing = required.filter(key => !adminData[key]);

      if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
      }

      // Validate email
      if (!validateEmail(adminData.email)) {
        throw new Error(`Invalid email format: ${adminData.email}`);
      }

      // Validate role
      if (!validateRole(adminData.role)) {
        throw new Error(`Invalid role: ${adminData.role}`);
      }

      // Check if admin already exists
      const existingAdmin = await Admin.findByEmail(adminData.email);

      if (existingAdmin) {
        console.log(`  ⊘ Skipped - Admin already exists: ${adminData.email}\n`);
        results.skipped.push(adminData.email);
        continue;
      }

      // Create admin
      const newAdminData = {
        name: adminData.name,
        email: adminData.email,
        password_hash: adminData.password,
        role: adminData.role,
        is_active: true
      };

      if (adminData.phone) {
        newAdminData.phone = adminData.phone;
      }

      const admin = await Admin.create(newAdminData);

      console.log(`  ✓ Created: ${admin.email} (${admin.role})\n`);
      results.created.push({ email: admin.email, role: admin.role });

      logger.info(`Admin created via config: ${admin.email} (${admin.role})`);

    } catch (error) {
      console.log(`  ✗ Error: ${error.message}\n`);
      results.errors.push({ email: adminData.email || 'unknown', error: error.message });
    }
  }

  // Show summary
  console.log('=================================');
  console.log('Summary:');
  console.log('=================================');
  console.log(`✓ Created:  ${results.created.length}`);
  console.log(`⊘ Skipped:  ${results.skipped.length}`);
  console.log(`✗ Errors:   ${results.errors.length}`);
  console.log('=================================\n');

  if (results.created.length > 0) {
    console.log('Created admins:');
    results.created.forEach(admin => {
      console.log(`  - ${admin.email} (${admin.role})`);
    });
    console.log();
  }

  if (results.errors.length > 0) {
    console.log('Errors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.email}: ${err.error}`);
    });
    console.log();
  }
}

// ============================================
// MODE 4: INTERACTIVE MODE
// ============================================

async function seedInteractive() {
  console.log('Running in Interactive mode...\n');
  console.log('Follow the prompts to create admin accounts\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));

  const adminsToCreate = [];
  let createAnother = true;

  while (createAnother) {
    console.log('--- New Admin ---');

    // Get email
    let email;
    while (true) {
      email = await question('Email: ');
      if (validateEmail(email)) {
        break;
      }
      console.log('  ✗ Invalid email format. Please try again.');
    }

    // Get name
    const name = await question('Full Name: ');

    // Get role
    let role;
    while (true) {
      console.log('Select role:');
      console.log('  1. super_admin - Full system access');
      console.log('  2. admin - Manage events, schools, payments');
      console.log('  3. moderator - Limited permissions');
      const roleChoice = await question('Enter number (1-3): ');

      if (roleChoice === '1') {
        role = 'super_admin';
        break;
      } else if (roleChoice === '2') {
        role = 'admin';
        break;
      } else if (roleChoice === '3') {
        role = 'moderator';
        break;
      } else {
        console.log('  ✗ Invalid choice. Please enter 1, 2, or 3.');
      }
    }

    // Get password
    let password;
    while (true) {
      password = await question('Password (min 8 chars): ');
      const passwordCheck = validatePassword(password);
      if (passwordCheck.valid) {
        break;
      }
      console.log(`  ✗ ${passwordCheck.message}`);
    }

    // Get phone (optional)
    const phone = await question('Phone (optional, press Enter to skip): ');

    // Add to list
    adminsToCreate.push({ email, name, role, password, phone: phone || undefined });

    console.log('  ✓ Admin added to list\n');

    // Ask if create another
    const another = await question('Create another admin? (yes/no): ');
    createAnother = another.toLowerCase() === 'yes' || another.toLowerCase() === 'y';
    console.log();
  }

  rl.close();

  // Confirmation
  console.log('=================================');
  console.log(`Ready to create ${adminsToCreate.length} admin(s):`);
  console.log('=================================');
  adminsToCreate.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.role}`);
  });
  console.log('=================================\n');

  // Create admins
  const results = {
    created: [],
    skipped: [],
    errors: []
  };

  for (const adminData of adminsToCreate) {
    try {
      // Check if admin already exists
      const existingAdmin = await Admin.findByEmail(adminData.email);

      if (existingAdmin) {
        console.log(`⊘ Skipped - Admin already exists: ${adminData.email}`);
        results.skipped.push(adminData.email);
        continue;
      }

      // Create admin
      const newAdminData = {
        name: adminData.name,
        email: adminData.email,
        password_hash: adminData.password,
        role: adminData.role,
        is_active: true
      };

      if (adminData.phone) {
        newAdminData.phone = adminData.phone;
      }

      const admin = await Admin.create(newAdminData);

      console.log(`✓ Created: ${admin.email} (${admin.role})`);
      results.created.push({ email: admin.email, role: admin.role });

      logger.info(`Admin created via interactive: ${admin.email} (${admin.role})`);

    } catch (error) {
      console.log(`✗ Error creating ${adminData.email}: ${error.message}`);
      results.errors.push({ email: adminData.email, error: error.message });
    }
  }

  // Show summary
  console.log('\n=================================');
  console.log('Summary:');
  console.log('=================================');
  console.log(`✓ Created:  ${results.created.length}`);
  console.log(`⊘ Skipped:  ${results.skipped.length}`);
  console.log(`✗ Errors:   ${results.errors.length}`);
  console.log('=================================\n');
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  console.log('\n========================================');
  console.log('GEMA Admin Seeder');
  console.log('========================================\n');

  try {
    // Parse arguments
    const args = parseArgs();

    // Connect to database
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Route to appropriate mode
    const mode = args.mode || 'env';

    switch (mode) {
      case 'env':
        await seedFromEnv();
        break;

      case 'cli':
        await seedFromCli(args);
        break;

      case 'config':
        await seedFromConfig(args);
        break;

      case 'interactive':
        await seedInteractive();
        break;

      default:
        throw new Error(`Unknown mode: ${mode}\nValid modes: env, cli, config, interactive\nUse --help for usage information`);
    }

  } catch (error) {
    console.error('\n✗ Error:');
    console.error(error.message);
    if (error.code === 11000) {
      console.error('\nDuplicate key error. Admin with this email already exists.');
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
main();

const mongoose = require('mongoose')
const Website = require('../models/Website')
const User = require('../models/User')
const websitesData = require('../data/websites.json')
require('dotenv').config()

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gema-chatbot')
    console.log('✅ Connected to MongoDB')
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️ Clearing existing data...')
    await Website.deleteMany({})
    
    // Seed websites
    console.log('🌱 Seeding website data...')
    const websites = await Website.insertMany(websitesData)
    console.log(`✅ Created ${websites.length} websites`)
    
    // Create default admin user
    console.log('👤 Creating default admin user...')
    await User.createDefaultAdmin()
    
    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   • Websites: ${websites.length}`)
    console.log(`   • Admin user: 1`)
    console.log('\n🔐 Default admin credentials:')
    console.log(`   • Username: ${process.env.ADMIN_USERNAME || 'admin'}`)
    console.log(`   • Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`)
    console.log('\n⚠️  Remember to change the default password in production!')
    
    // Display created websites
    console.log('\n🌐 Created websites:')
    websites.forEach((website, index) => {
      console.log(`   ${index + 1}. ${website.name} (${website.domain})`)
    })
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n🔌 Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the seeder
if (require.main === module) {
  seedData().catch(err => {
    console.error('❌ Seeding failed:', err)
    process.exit(1)
  })
}

module.exports = seedData()
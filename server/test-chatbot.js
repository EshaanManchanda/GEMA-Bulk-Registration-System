/**
 * Quick test script for chatbot functionality
 * Run: node test-chatbot.js
 */

require('dotenv').config();

const { detectIntent, extractEventInfo, extractEmail } = require('./src/services/chatbot/huggingface.service');

async function testChatbot() {
  console.log('🤖 Testing Chatbot Services...\n');

  // Test 1: Intent Detection
  console.log('1️⃣ Testing Intent Detection:');
  const testMessages = [
    'Hello',
    'When is the exam?',
    'Generate my certificate',
    'How to pay?',
    'Random message'
  ];

  for (const msg of testMessages) {
    try {
      const intent = await detectIntent(msg);
      console.log(`   "${msg}" → ${intent}`);
    } catch (error) {
      console.log(`   "${msg}" → ERROR: ${error.message}`);
    }
  }

  // Test 2: Email Extraction
  console.log('\n2️⃣ Testing Email Extraction:');
  const emailTests = [
    'My email is test@example.com',
    'Certificate for john.doe@school.edu',
    'No email here'
  ];

  for (const msg of emailTests) {
    const email = extractEmail(msg);
    console.log(`   "${msg}" → ${email || 'None'}`);
  }

  // Test 3: Event Info Extraction
  console.log('\n3️⃣ Testing Event Info Extraction:');
  const eventTests = [
    'When is Scratch Olympiad?',
    'Tell me about Painting competition',
    'https://scratcholympiad.com exam date'
  ];

  for (const msg of eventTests) {
    const info = extractEventInfo(msg);
    console.log(`   "${msg}" → [${info.join(', ')}]`);
  }

  console.log('\n✅ Tests complete!');
}

testChatbot().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});

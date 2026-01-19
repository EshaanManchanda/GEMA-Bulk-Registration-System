const axios = require('axios');

async function testIntent(message, expectedIntent) {
  try {
    console.log(`\nTesting message: "${message}"`)
    console.log(`Expected intent: ${expectedIntent}`);
    
    // First make a request to a special endpoint to get the detected intent without processing
    const intentResponse = await axios.post('http://localhost:5000/api/chat/detect-intent', {
      message
    });
    
    console.log(`Detected intent: ${intentResponse.data.intent}`);
    
    // Then make the actual message request
    const response = await axios.post('http://localhost:5000/api/chat/message', {
      message,
      sessionId: 'test-session'
    });
    
    console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    
    // Check if the detected intent matches the expected intent
    if (intentResponse.data.intent === expectedIntent) {
      console.log('✅ PASS: Intent detection matches expected intent');
    } else {
      console.log(`❌ FAIL: Intent detection returned "${intentResponse.data.intent}" but expected "${expectedIntent}"`);
    }
    
    console.log('-'.repeat(50));
  } catch (error) {
    console.error(`Error testing message "${message}": ${error.message}`);
    if (error.response) {
      console.error(`Response data: ${JSON.stringify(error.response.data)}`);
    }
    console.log('-'.repeat(50));
  }
}

async function runTests() {
  // Test various intents
  await testIntent('Hello, how are you?', 'greeting');
  await testIntent('I need my certificate', 'certificate');
  await testIntent('When is the exam date?', 'exam_date');
  await testIntent('How do I make a payment?', 'payment');
  await testIntent('Can you give me information about the website?', 'website_info');
  await testIntent('Random message that should be general', 'general');
  
  // Additional test cases
  console.log('\n=== ADDITIONAL TEST CASES ===');
  await testIntent('Tell me about your website', 'website_info');
  await testIntent('I want to know when the next exam is scheduled', 'exam_date');
  await testIntent('How can I pay for registration?', 'payment');
  await testIntent('This is just a test message', 'general');
  
  // Test specific website queries
  console.log('\n=== SPECIFIC WEBSITE QUERIES ===');
  await testIntent('I need my certificate for International Scratch Olympiad', 'certificate');
  await testIntent('When is the International Painting Olympics exam?', 'exam_date');
  await testIntent('How do I pay for Scratch Olympiad?', 'payment');
  await testIntent('Tell me about the International Scratch Olympiad website', 'website_info');
}

runTests();
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5050/api/v1/chatbot/event-data';
const TEST_API_KEY = 'test_api_key_12345'; // Assumes the test event from previous verification still exists or we might need to recreate it.

async function runTest() {
    console.log('Testing /event-data endpoint...');

    // Case A: Valid Key
    try {
        const res = await axios.get(API_URL, {
            headers: { 'X-API-Key': TEST_API_KEY }
        });
        console.log('\n[PASS] Valid Key Request');
        console.log('Registration Link:', res.data.data.registration_link);
        console.log('Status:', res.data.data.status);
        console.log('Banner Image:', res.data.data.banner_image);
        console.log('Raw Dates:', JSON.stringify(res.data.data.dates.raw, null, 2));

        console.log('FAQs Found:', res.data.data.faqs ? res.data.data.faqs.length : 0);
        if (res.data.data.faqs && res.data.data.faqs.length > 0) {
            console.log('First FAQ Preview:', res.data.data.faqs[0]);
        }

        console.log('\nFull Response Data Keys:', Object.keys(res.data.data));
        // console.log('Full Response:', JSON.stringify(res.data, null, 2));
    } catch (e) {
        console.error('\n[FAIL] Valid Key Request Failed', e.response?.data || e.message);
    }

    // Case B: Invalid Key
    try {
        await axios.get(API_URL, {
            headers: { 'X-API-Key': 'invalid_key' }
        });
        console.log('\n[FAIL] Invalid Key Request should have failed');
    } catch (e) {
        if (e.response?.status === 401) {
            console.log('\n[PASS] Invalid Key Request (401 Unauthorized)');
        } else {
            console.log('\n[FAIL] Invalid Key Request Unexpected Error', e.response?.status || e.message);
        }
    }
}

runTest();

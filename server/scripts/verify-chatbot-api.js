const mongoose = require('mongoose');
const Event = require('../src/models/Event');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5050/api/v1/chatbot/message';
const TEST_API_KEY = 'test_api_key_12345';
const TEST_EVENT_SLUG = 'test-chatbot-event';

async function runTest() {
    try {
        // 1. Connect to DB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // 2. Create/Update a Test Event with API Key
        let event = await Event.findOne({ event_slug: TEST_EVENT_SLUG });
        if (!event) {
            event = new Event({
                title: 'Test Chatbot Event',
                event_slug: TEST_EVENT_SLUG,
                category: 'olympiad',
                event_type: 'olympiad',
                status: 'active',
                event_start_date: new Date(),
                event_end_date: new Date(Date.now() + 86400000),
                registration_deadline: new Date(),
                base_fee_inr: 100,
                base_fee_usd: 10,
                created_by: new mongoose.Types.ObjectId(), // Dummy Admin ID
                form_schema: [{
                    field_id: 'name_field',
                    field_label: 'Name',
                    field_type: 'text',
                    field_name: 'name',
                    required: true,
                    order: 0
                }],
                chatbot_config_india: {
                    enabled: true,
                    api_key: TEST_API_KEY,
                    website_id: 'test_website_id'
                }
            });
            await event.save();
            console.log('Created test event');
        } else {
            event.chatbot_config_india = {
                enabled: true,
                api_key: TEST_API_KEY,
                website_id: 'test_website_id'
            };
            event.certificate_config_india = {
                enabled: true,
                website_url: 'https://custom-india-url.com',
                auto_generate: false
            };
            await event.save();
            console.log('Updated test event');

            // Create test FAQ
            const FAQ = require('../src/models/FAQ');
            await FAQ.deleteMany({ eventId: event._id }); // Clear old
            await FAQ.create({
                query: 'What is this event?',
                response: 'This is a test event for chatbot verification.',
                eventId: event._id,
                isActive: true,
                category: 'General',
                location: 'india'
            });
            console.log('Created test FAQ');
        }

        // 3. Test Cases

        // Case A: Valid Key
        console.log('\n--- Test A: Valid API Key ---');
        try {
            const res = await axios.post(API_URL, {
                message: 'When is the event?',
                sessionId: 'test-session-valid'
            }, {
                headers: { 'X-API-Key': TEST_API_KEY }
            });
            console.log('Status:', res.status);
            console.log('Response Message Preview:', res.data.message.substring(0, 200));
            console.log('Response Data Keys:', Object.keys(res.data));
            if (res.data.data) {
                console.log('Response Data.Data Keys:', Object.keys(res.data.data));
                if (res.data.data.registration_link) console.log('Registration Link:', res.data.data.registration_link);
            }

            const messageContainsEvent = res.data.message.includes('Test Chatbot Event');
            const dataContainsEvent = res.data.data?.event?.slug === TEST_EVENT_SLUG;
            const noOtherEvents = !res.data.message.includes('Our Available Events'); // Heuristic

            if (messageContainsEvent || dataContainsEvent) {
                console.log('PASS: Correctly scoped to test event');
            } else {
                console.log('FAIL: Did not scope to test event. Message:', res.data.message.substring(0, 100));
            }
        } catch (e) {
            console.error('FAIL: Request error', e.response?.data || e.message);
        }

        // Case B: Invalid Key
        console.log('\n--- Test B: Invalid API Key ---');
        try {
            await axios.post(API_URL, {
                message: 'Hello'
            }, {
                headers: { 'X-API-Key': 'wrong_key' }
            });
            console.log('FAIL: Should have returned 401');
        } catch (e) {
            if (e.response?.status === 401) {
                console.log('PASS: Returned 401 Unauthorized');
            } else {
                console.log('FAIL: Unexpected error', e.response?.status || e.message);
            }
        }

        // Case C: No Key (Should be generic)
        console.log('\n--- Test C: No API Key ---');
        try {
            const res = await axios.post(API_URL, {
                message: 'When is the event?',
                sessionId: 'test-session-no-key'
            });
            console.log('Status:', res.status);
            // Without scoping, "When is the event?" logic might return a list of events or ask "Which event?"
            // It definitely shouldn't automatically pick our test event just because.
            console.log('Response:', res.data.message.substring(0, 100) + '...');
            console.log('PASS: Request succeeded (Generic access)');
        } catch (e) {
            console.error('FAIL: Request error', e.response?.data || e.message);
        }

    } catch (err) {
        console.error('Test execution failed:', JSON.stringify(err, null, 2));
    } finally {
        // Cleanup
        // await Event.deleteOne({ event_slug: TEST_EVENT_SLUG });
        await mongoose.disconnect();
    }
}

runTest();

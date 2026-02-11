const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const API_URL = 'http://localhost:5050/api/v1/chatbot';
const API_KEY = process.env.CHATBOT_API_KEY_INDIA || 'test_api_key_12345';

async function runTest() {
    console.log('Testing Post Sync Integration...');

    // 1. Create a dummy CSV file
    const csvContent = `query,response,keyword,category,custom
"Test Page Title","This is the content of the test page.\n\nRead more: http://example.com/test-page","Test Page Title","Page","wp_post_123"`;

    const filePath = path.join(__dirname, 'temp_posts_export.csv');
    fs.writeFileSync(filePath, csvContent);

    console.log('Created temp CSV file:', filePath);

    try {
        // 2. Read file
        const fileData = fs.readFileSync(filePath);

        // 3. Construct Multipart Request Manually (to avoid external dep issues if form-data missing)
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

        let payload = `--${boundary}\r\n`;
        payload += `Content-Disposition: form-data; name="file"; filename="posts_export.csv"\r\n`;
        payload += `Content-Type: text/csv\r\n\r\n`;
        payload += csvContent + `\r\n`;

        payload += `--${boundary}\r\n`;
        payload += `Content-Disposition: form-data; name="location"\r\n\r\n`;
        payload += `global\r\n`;

        payload += `--${boundary}--`;

        console.log('Sending request to:', `${API_URL}/faqs/import-csv`);

        const res = await axios.post(`${API_URL}/faqs/import-csv`, payload, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            }
        });

        console.log('\n[PASS] Sync Success');
        console.log('Status:', res.status);
        console.log('Response:', JSON.stringify(res.data, null, 2));

    } catch (e) {
        console.error('\n[FAIL] Sync Failed', e.response?.data || e.message);
    } finally {
        // Cleanup
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Cleaned up temp file');
        }
    }
}

runTest();

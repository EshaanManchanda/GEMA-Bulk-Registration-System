require('dotenv').config();

console.log('='.repeat(60));
console.log('🔍 CORS DEBUGGING INFORMATION');
console.log('='.repeat(60));
console.log('');
console.log('Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  PORT:', process.env.PORT);
console.log('  FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('  ALLOWED_ORIGINS (raw):', process.env.ALLOWED_ORIGINS);
console.log('');
console.log('Parsed Allowed Origins:');
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:5173'];
allowedOrigins.forEach((origin, index) => {
    console.log(`  [${index}]: "${origin}"`);
});
console.log('');
console.log('Test Origins:');
const testOrigins = [
    'http://localhost:5173',
    'http://localhost:5173/',
    'https://bulk.intlspellbee.com',
    'https://bulk.intlspellbee.com/'
];
testOrigins.forEach(testOrigin => {
    const isAllowed = allowedOrigins.indexOf(testOrigin) !== -1;
    console.log(`  ${isAllowed ? '✅' : '❌'} "${testOrigin}"`);
});
console.log('');
console.log('='.repeat(60));

require('dotenv').config();
console.log('Starting targeted diagnostic...');

try {
    console.log('Testing mongoose load...');
    require('mongoose');
    console.log('✓ Mongoose loaded');
} catch (e) {
    console.error('✗ Failed to load mongoose:', e.message);
}

try {
    console.log('Testing Event Model load...');
    require('./src/models/Event');
    console.log('✓ Event Model loaded');
} catch (e) {
    console.error('✗ Failed to load Event Model:', e.message);
}

try {
    console.log('Testing FAQ Model load...');
    require('./src/models/FAQ');
    console.log('✓ FAQ Model loaded');
} catch (e) {
    console.error('✗ Failed to load FAQ Model:', e.message);
}

console.log('Targeted diagnostic complete.');

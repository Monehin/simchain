#!/usr/bin/env node

const crypto = require('crypto');

console.log('Generating secure encryption key for phone number encryption...\n');

// Generate a random 32-byte key
const key = crypto.randomBytes(32);
const keyBase64 = key.toString('base64');

console.log('Generated 32-byte encryption key:');
console.log('=====================================');
console.log(keyBase64);
console.log('=====================================\n');

console.log('Add this to your .env.local file as:');
console.log(`ENCRYPTION_SECRET_KEY="${keyBase64}"\n`);

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. Keep this key secure and never commit it to version control');
console.log('2. If you lose this key, you cannot decrypt existing phone numbers');
console.log('3. Use different keys for development, staging, and production');
console.log('4. Backup this key securely'); 
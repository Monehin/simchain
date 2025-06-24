#!/usr/bin/env ts-node

/**
 * Test Missing Environment Variables
 * Demonstrates error handling when required environment variables are missing
 */

import { validateStartup } from '../utils/startup';

console.log('🧪 Testing Missing Environment Variables...\n');

// Clear all environment variables to simulate missing .env file
const originalEnv = { ...process.env };
Object.keys(process.env).forEach(key => {
  if (key.startsWith('SOLANA_') || 
      key.startsWith('PROGRAM_') || 
      key.startsWith('JWT_') || 
      key.startsWith('ENCRYPTION_') || 
      key.startsWith('LOG_') || 
      key.startsWith('PORT') || 
      key.startsWith('NODE_ENV')) {
    delete process.env[key];
  }
});

console.log('❌ Environment variables cleared to simulate missing .env file\n');

try {
  console.log('🔍 Attempting to validate environment...');
  validateStartup();
  console.log('❌ This should not happen - validation should have failed!');
} catch (error) {
  console.log('✅ Environment validation correctly failed with error:');
  console.log('='.repeat(60));
  console.log(error instanceof Error ? error.message : error);
  console.log('='.repeat(60));
  console.log('\n💡 This demonstrates the early validation feature working correctly!');
  console.log('📋 The application will exit with a clear error message if required');
  console.log('   environment variables are missing, preventing runtime errors.');
}

// Restore original environment
Object.assign(process.env, originalEnv);

console.log('\n🔄 Original environment restored.');
console.log('✅ Test completed successfully!'); 
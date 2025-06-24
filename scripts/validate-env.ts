#!/usr/bin/env ts-node

/**
 * Environment Validation Test Script
 * Tests the environment validation functionality
 */

import { validateCompleteStartup, validateStartup } from '../utils/startup';
import { validateSolanaEnv, validateUSSDEnv, validateSecurityEnv } from '../utils/env';

console.log('🧪 Testing Environment Validation...\n');

// Test 1: Complete startup validation
console.log('Test 1: Complete Startup Validation');
console.log('-'.repeat(40));
try {
  validateCompleteStartup();
  console.log('✅ Complete startup validation passed\n');
} catch (error) {
  console.log('❌ Complete startup validation failed:');
  console.log(error instanceof Error ? error.message : error);
  console.log('');
}

// Test 2: Basic startup validation
console.log('Test 2: Basic Startup Validation');
console.log('-'.repeat(40));
try {
  validateStartup();
  console.log('✅ Basic startup validation passed\n');
} catch (error) {
  console.log('❌ Basic startup validation failed:');
  console.log(error instanceof Error ? error.message : error);
  console.log('');
}

// Test 3: Solana environment validation
console.log('Test 3: Solana Environment Validation');
console.log('-'.repeat(40));
try {
  const solanaConfig = validateSolanaEnv();
  console.log('✅ Solana environment validation passed');
  console.log(`   Cluster URL: ${solanaConfig.clusterUrl}`);
  console.log(`   Commitment: ${solanaConfig.commitment}`);
  console.log(`   Program ID: ${solanaConfig.programId}\n`);
} catch (error) {
  console.log('❌ Solana environment validation failed:');
  console.log(error instanceof Error ? error.message : error);
  console.log('');
}

// Test 4: Security environment validation
console.log('Test 4: Security Environment Validation');
console.log('-'.repeat(40));
try {
  const securityConfig = validateSecurityEnv();
  console.log('✅ Security environment validation passed');
  console.log(`   JWT Secret: ${securityConfig.jwtSecret.substring(0, 8)}...`);
  console.log(`   Encryption Key: ${securityConfig.encryptionKey.substring(0, 8)}...\n`);
} catch (error) {
  console.log('❌ Security environment validation failed:');
  console.log(error instanceof Error ? error.message : error);
  console.log('');
}

// Test 5: USSD environment validation (optional)
console.log('Test 5: USSD Environment Validation (Optional)');
console.log('-'.repeat(40));
try {
  const ussdConfig = validateUSSDEnv();
  console.log('✅ USSD environment validation passed');
  console.log(`   API Key: ${ussdConfig.apiKey.substring(0, 8)}...`);
  console.log(`   Username: ${ussdConfig.username}`);
  console.log(`   Sender ID: ${ussdConfig.senderId}\n`);
} catch (error) {
  console.log('⚠️  USSD environment validation failed (this is optional in development):');
  console.log(error instanceof Error ? error.message : error);
  console.log('');
}

console.log('🏁 Environment validation tests completed!'); 
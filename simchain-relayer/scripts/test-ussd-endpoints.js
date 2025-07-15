#!/usr/bin/env node

/**
 * Test script for USSD endpoints
 * This script tests all the API endpoints used by the USSD simulator
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const TEST_SIM = '+1234567890';
const TEST_PIN = '123456';
const TEST_COUNTRY = 'RW';

async function testEndpoint(name, method, endpoint, data = null) {
  console.log(`\n🧪 Testing ${name}...`);
  
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${name}: SUCCESS`);
      console.log(`   Response:`, JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ ${name}: FAILED`);
      console.log(`   Error:`, result.error || 'Unknown error');
    }
    
    return result.success;
  } catch (error) {
    console.log(`❌ ${name}: ERROR`);
    console.log(`   Error:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting USSD Endpoint Tests...\n');
  
  const tests = [
    {
      name: 'Check Balance (Existing User)',
      method: 'POST',
      endpoint: '/api/check-balance',
      data: { sim: TEST_SIM, pin: '000000', country: TEST_COUNTRY }
    },
    {
      name: 'Create Wallet (New User)',
      method: 'POST',
      endpoint: '/api/create-wallet',
      data: { sim: '+9998887776', pin: TEST_PIN, country: TEST_COUNTRY }
    },
    {
      name: 'Send Funds',
      method: 'POST',
      endpoint: '/api/send-funds',
      data: { fromSim: TEST_SIM, toSim: '+8887776666', amount: 0.01, pin: '000000', country: TEST_COUNTRY }
    },
    {
      name: 'Deposit Funds',
      method: 'POST',
      endpoint: '/api/deposit-funds',
      data: { sim: TEST_SIM, amount: 0.1, country: TEST_COUNTRY }
    },
    {
      name: 'Set Alias',
      method: 'POST',
      endpoint: '/api/set-alias',
      data: { sim: TEST_SIM, alias: 'TestUser123', pin: '000000', country: TEST_COUNTRY }
    },
    {
      name: 'Test Connection',
      method: 'GET',
      endpoint: '/api/test-connection'
    }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testEndpoint(test.name, test.method, test.endpoint, test.data);
    if (success) passed++;
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All USSD endpoints are working correctly!');
  } else {
    console.log('⚠️  Some endpoints need attention.');
  }
}

// Run the tests
runTests().catch(console.error); 
const BASE_URL = 'http://localhost:3000';

async function testUSSDFlow() {
  console.log('🧪 Testing USSD Flow...\n');

  // Test 1: Check if wallet exists for registered number
  console.log('1. Testing wallet existence check for registered number...');
  try {
    const response = await fetch(`${BASE_URL}/api/wallet-exists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sim: '+1234567890',
        country: 'RW'
      })
    });
    const result = await response.json();
    console.log('✅ Wallet exists check:', result.success ? 'PASSED' : 'FAILED');
    if (result.success && result.data.exists) {
      console.log('   - Wallet found for +1234567890');
      console.log('   - Address:', result.data.walletAddress);
      console.log('   - Alias:', result.data.alias);
    }
  } catch (error) {
    console.log('❌ Wallet exists check failed:', error.message);
  }

  // Test 2: Check if wallet exists for unregistered number
  console.log('\n2. Testing wallet existence check for unregistered number...');
  try {
    const response = await fetch(`${BASE_URL}/api/wallet-exists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sim: '+9999999999',
        country: 'RW'
      })
    });
    const result = await response.json();
    console.log('✅ Wallet exists check:', result.success ? 'PASSED' : 'FAILED');
    if (result.success && !result.data.exists) {
      console.log('   - No wallet found for +9999999999 (expected)');
    }
  } catch (error) {
    console.log('❌ Wallet exists check failed:', error.message);
  }

  // Test 3: Check balance for registered user (should work now)
  console.log('\n3. Testing balance check for registered user...');
  try {
    const response = await fetch(`${BASE_URL}/api/check-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sim: '+1234567890',
        pin: '123456', // Valid PIN
        country: 'RW'
      })
    });
    const result = await response.json();
    console.log('✅ Balance check:', result.success ? 'PASSED' : 'FAILED');
    if (result.success) {
      console.log('   - Balance:', result.data.balance);
      console.log('   - Alias:', result.data.alias);
    } else {
      console.log('   - Error:', result.error);
    }
  } catch (error) {
    console.log('❌ Balance check failed:', error.message);
  }

  // Test 4: Check balance for unregistered user (should fail)
  console.log('\n4. Testing balance check for unregistered user...');
  try {
    const response = await fetch(`${BASE_URL}/api/check-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sim: '+9999999999',
        pin: '123456',
        country: 'RW'
      })
    });
    const result = await response.json();
    console.log('✅ Balance check for unregistered:', !result.success ? 'PASSED (correctly failed)' : 'FAILED');
    if (!result.success) {
      console.log('   - Expected error:', result.error);
    }
  } catch (error) {
    console.log('❌ Balance check failed:', error.message);
  }

  console.log('\n🎉 USSD Flow Test Complete!');
}

testUSSDFlow().catch(console.error); 
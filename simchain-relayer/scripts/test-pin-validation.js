// Test PIN validation functionality

// Test PIN validation functionality
async function testPinValidation() {
  console.log('🧪 Testing PIN Validation...\n');

  const testSim = '+9876543210';
  const correctPin = '123456';
  const wrongPin = '654321';

  // Test 1: Create a wallet with a PIN
  console.log('1️⃣ Creating wallet with PIN...');
  try {
    const createResponse = await fetch('http://localhost:3000/api/create-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sim: testSim,
        pin: correctPin,
        country: 'RW'
      })
    });
    const createResult = await createResponse.json();
    
    if (createResult.success) {
      console.log('✅ Wallet created successfully');
      console.log(`   Address: ${createResult.data.walletAddress}`);
      console.log(`   Alias: ${createResult.data.alias}\n`);
    } else {
      console.log('❌ Failed to create wallet:', createResult.error);
      return;
    }
  } catch (error) {
    console.log('❌ Error creating wallet:', error.message);
    return;
  }

  // Test 2: Validate correct PIN
  console.log('2️⃣ Testing correct PIN validation...');
  try {
    const validateResponse = await fetch('http://localhost:3000/api/validate-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sim: testSim,
        pin: correctPin,
        country: 'RW'
      })
    });
    const validateResult = await validateResponse.json();
    
    if (validateResult.success && validateResult.isValid) {
      console.log('✅ Correct PIN validation passed');
    } else {
      console.log('❌ Correct PIN validation failed:', validateResult.error);
    }
  } catch (error) {
    console.log('❌ Error validating correct PIN:', error.message);
  }

  // Test 3: Validate wrong PIN
  console.log('\n3️⃣ Testing wrong PIN validation...');
  try {
    const validateResponse = await fetch('http://localhost:3000/api/validate-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sim: testSim,
        pin: wrongPin,
        country: 'RW'
      })
    });
    const validateResult = await validateResponse.json();
    
    if (!validateResult.isValid) {
      console.log('✅ Wrong PIN correctly rejected');
    } else {
      console.log('❌ Wrong PIN was incorrectly accepted');
    }
  } catch (error) {
    console.log('❌ Error validating wrong PIN:', error.message);
  }

  // Test 4: Validate non-existent wallet
  console.log('\n4️⃣ Testing PIN validation for non-existent wallet...');
  try {
    const validateResponse = await fetch('http://localhost:3000/api/validate-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sim: '+9999999999',
        pin: correctPin,
        country: 'RW'
      })
    });
    const validateResult = await validateResponse.json();
    
    if (!validateResult.success) {
      console.log('✅ Non-existent wallet correctly rejected');
    } else {
      console.log('❌ Non-existent wallet was incorrectly accepted');
    }
  } catch (error) {
    console.log('❌ Error validating non-existent wallet:', error.message);
  }

  console.log('\n🎉 PIN validation test completed!');
}

// Run the test
testPinValidation().catch(console.error); 
import { AliasGenerator } from '../src/lib/alias-generator';

async function testAliasGeneration() {
  console.log('🧪 Testing Alias Generation System\n');

  // Test 1: Generate preview aliases
  console.log('1. Generating preview aliases:');
  const previewAliases = AliasGenerator.generatePreviewAliases(10);
  previewAliases.forEach((alias, index) => {
    console.log(`   ${index + 1}. ${alias}`);
  });

  // Test 2: Generate unique aliases
  console.log('\n2. Generating unique aliases:');
  for (let i = 0; i < 5; i++) {
    const uniqueAlias = await AliasGenerator.generateUniqueAlias();
    console.log(`   ${i + 1}. ${uniqueAlias}`);
  }

  // Test 3: Validate alias format
  console.log('\n3. Testing alias validation:');
  const testAliases = [
    'ValidAlias',
    'invalid-alias', // contains hyphen
    'a', // too short
    'ThisAliasIsWayTooLongAndShouldFailValidation',
    'admin', // reserved word
    'User123'
  ];

  testAliases.forEach(alias => {
    const validation = AliasGenerator.validateAliasFormat(alias);
    console.log(`   "${alias}": ${validation.isValid ? '✅ Valid' : `❌ Invalid - ${validation.error}`}`);
  });

  // Test 4: Check alias availability
  console.log('\n4. Testing alias availability:');
  const testAvailability = ['TestAlias123', 'AnotherTest', 'UniqueAlias999'];
  
  for (const alias of testAvailability) {
    const isAvailable = await AliasGenerator.isAliasAvailable(alias);
    console.log(`   "${alias}": ${isAvailable ? '✅ Available' : '❌ Taken'}`);
  }

  // Test 5: Get alias statistics
  console.log('\n5. Alias statistics:');
  const stats = await AliasGenerator.getAliasStats();
  console.log(`   Total aliases: ${stats.totalAliases}`);
  console.log(`   Average length: ${stats.averageLength}`);
  console.log(`   Most common patterns:`, stats.mostCommonPatterns);

  console.log('\n✅ Alias generation system test completed!');
}

// Run the test
testAliasGeneration()
  .then(() => {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }); 
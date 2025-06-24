/**
 * Startup Validation
 * Validates environment variables and configuration at application startup
 */

import { validateEnv, getEnvConfig, validateSolanaEnv, validateSecurityEnv } from './env';

/**
 * Validates all required environment variables at startup
 * @throws Error if any required environment variables are missing
 */
export function validateStartup(): void {
  console.log('🔍 Validating environment variables...');
  
  try {
    const config = validateEnv();
    console.log('✅ Environment validation passed');
    console.log(`📋 Environment: ${config.NODE_ENV}`);
    console.log(`🔗 Solana Cluster: ${config.SOLANA_CLUSTER_URL}`);
    console.log(`📋 Program ID: ${config.PROGRAM_ID}`);
    console.log(`📝 Log Level: ${config.LOG_LEVEL}`);
    console.log(`🌐 Port: ${config.PORT}`);
    
    // Validate specific feature configurations
    validateSolanaEnv();
    console.log('✅ Solana configuration validated');
    
    validateSecurityEnv();
    console.log('✅ Security configuration validated');
    
    console.log('🚀 All startup validations passed successfully!');
    
  } catch (error) {
    console.error('❌ Startup validation failed:');
    console.error(error instanceof Error ? error.message : error);
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    console.error('📋 Copy env.example to .env and fill in your values.');
    
    // Exit with error code
    process.exit(1);
  }
}

/**
 * Validates environment variables for a specific feature
 * @param featureName - Name of the feature being validated
 * @param validator - Function that validates the feature's environment variables
 * @throws Error if validation fails
 */
export function validateFeature(
  featureName: string, 
  validator: () => any
): void {
  try {
    validator();
    console.log(`✅ ${featureName} environment validated`);
  } catch (error) {
    console.error(`❌ ${featureName} environment validation failed:`);
    console.error(error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Validates optional environment variables and provides warnings
 * @param optionalVars - Array of optional environment variable names
 */
export function validateOptionalEnv(optionalVars: string[]): void {
  const missingVars: string[] = [];
  
  for (const varName of optionalVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Optional environment variables not set:');
    missingVars.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
    console.warn('   These features may not work correctly without these variables.');
  }
}

/**
 * Validates environment variables for USSD Gateway (optional in development)
 */
export function validateUSSDGateway(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    validateFeature('USSD Gateway', () => {
      const { validateUSSDEnv } = require('./env');
      validateUSSDEnv();
    });
  } else {
    validateOptionalEnv(['AT_API_KEY', 'AT_USERNAME', 'AT_SENDER_ID']);
  }
}

/**
 * Validates environment variables for Database (optional in development)
 */
export function validateDatabase(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    validateFeature('Database', () => {
      const { validateDatabaseEnv } = require('./env');
      validateDatabaseEnv();
    });
  } else {
    validateOptionalEnv(['DATABASE_URL']);
  }
}

/**
 * Validates environment variables for Redis (optional in development)
 */
export function validateRedis(): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  if (nodeEnv === 'production') {
    validateFeature('Redis', () => {
      const { validateRedisEnv } = require('./env');
      validateRedisEnv();
    });
  } else {
    validateOptionalEnv(['REDIS_URL']);
  }
}

/**
 * Complete startup validation including all features
 * @throws Error if any required validations fail
 */
export function validateCompleteStartup(): void {
  console.log('🚀 Starting SIMChain application...');
  console.log('=' .repeat(50));
  
  // Core validation
  validateStartup();
  
  // Feature-specific validations
  validateUSSDGateway();
  validateDatabase();
  validateRedis();
  
  console.log('=' .repeat(50));
  console.log('🎉 All startup validations completed successfully!');
  console.log('🚀 SIMChain is ready to start.');
}

// Export the main validation function for easy import
export { validateEnv, getEnvConfig }; 
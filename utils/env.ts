/**
 * Environment Variable Validation
 * Validates required environment variables at startup
 */

interface EnvConfig {
  // Solana Configuration
  SOLANA_CLUSTER_URL: string;
  SOLANA_COMMITMENT: string;
  PROGRAM_ID: string;
  
  // USSD Gateway Configuration
  AT_API_KEY: string;
  AT_USERNAME: string;
  AT_SENDER_ID: string;
  
  // Database Configuration
  DATABASE_URL: string;
  
  // Redis Configuration
  REDIS_URL: string;
  
  // Security Configuration
  JWT_SECRET: string;
  ENCRYPTION_KEY: string;
  
  // Logging Configuration
  LOG_LEVEL: string;
  LOG_FILE: string;
  
  // Server Configuration
  PORT: string;
  NODE_ENV: string;
}

/**
 * Required environment variables for different environments
 */
const REQUIRED_ENV_VARS = {
  development: [
    'SOLANA_CLUSTER_URL',
    'PROGRAM_ID',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'LOG_LEVEL',
    'PORT',
    'NODE_ENV'
  ],
  production: [
    'SOLANA_CLUSTER_URL',
    'PROGRAM_ID',
    'AT_API_KEY',
    'AT_USERNAME',
    'AT_SENDER_ID',
    'DATABASE_URL',
    'REDIS_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'LOG_LEVEL',
    'LOG_FILE',
    'PORT',
    'NODE_ENV'
  ],
  test: [
    'SOLANA_CLUSTER_URL',
    'PROGRAM_ID',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'LOG_LEVEL',
    'NODE_ENV'
  ]
};

/**
 * Default values for optional environment variables
 */
const DEFAULT_VALUES: Partial<EnvConfig> = {
  SOLANA_COMMITMENT: 'confirmed',
  LOG_LEVEL: 'info',
  LOG_FILE: './logs/simchain.log',
  PORT: '3000',
  NODE_ENV: 'development'
};

/**
 * Validates environment variables and returns a validated config
 * @throws Error if required environment variables are missing
 */
export function validateEnv(): EnvConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const requiredVars = REQUIRED_ENV_VARS[nodeEnv as keyof typeof REQUIRED_ENV_VARS] || REQUIRED_ENV_VARS.development;
  
  const missingVars: string[] = [];
  const config: Partial<EnvConfig> = {};
  
  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      config[varName as keyof EnvConfig] = value;
    }
  }
  
  // Apply default values for optional variables
  for (const [key, defaultValue] of Object.entries(DEFAULT_VALUES)) {
    if (!config[key as keyof EnvConfig]) {
      config[key as keyof EnvConfig] = defaultValue as string;
    }
  }
  
  // Throw error if any required variables are missing
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables for ${nodeEnv} environment:\n` +
      missingVars.map(varName => `  - ${varName}`).join('\n') +
      '\n\nPlease check your .env file or environment configuration.';
    
    throw new Error(errorMessage);
  }
  
  return config as EnvConfig;
}

/**
 * Validates environment variables and returns a validated config with type safety
 * @throws Error if required environment variables are missing
 */
export function getEnvConfig(): EnvConfig {
  return validateEnv();
}

/**
 * Validates a specific environment variable
 * @param varName - The environment variable name
 * @param required - Whether the variable is required (default: true)
 * @param defaultValue - Default value if not required and not set
 * @returns The environment variable value
 * @throws Error if required variable is missing
 */
export function getEnvVar(
  varName: string, 
  required: boolean = true, 
  defaultValue?: string
): string {
  const value = process.env[varName];
  
  if (!value) {
    if (required) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
    return defaultValue || '';
  }
  
  return value;
}

/**
 * Validates environment variables for a specific feature/module
 * @param requiredVars - Array of required environment variable names
 * @returns Object with validated environment variables
 * @throws Error if any required variables are missing
 */
export function validateFeatureEnv(requiredVars: string[]): Record<string, string> {
  const missingVars: string[] = [];
  const config: Record<string, string> = {};
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      missingVars.push(varName);
    } else {
      config[varName] = value;
    }
  }
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables:\n` +
      missingVars.map(varName => `  - ${varName}`).join('\n') +
      '\n\nPlease check your .env file or environment configuration.';
    
    throw new Error(errorMessage);
  }
  
  return config;
}

/**
 * Validates Solana-specific environment variables
 * @returns Object with validated Solana configuration
 * @throws Error if required Solana variables are missing
 */
export function validateSolanaEnv(): {
  clusterUrl: string;
  commitment: string;
  programId: string;
} {
  const config = validateFeatureEnv(['SOLANA_CLUSTER_URL', 'PROGRAM_ID']);
  const commitment = getEnvVar('SOLANA_COMMITMENT', false, 'confirmed');
  
  return {
    clusterUrl: config.SOLANA_CLUSTER_URL,
    commitment,
    programId: config.PROGRAM_ID
  };
}

/**
 * Validates USSD Gateway environment variables
 * @returns Object with validated USSD configuration
 * @throws Error if required USSD variables are missing
 */
export function validateUSSDEnv(): {
  apiKey: string;
  username: string;
  senderId: string;
} {
  const config = validateFeatureEnv(['AT_API_KEY', 'AT_USERNAME', 'AT_SENDER_ID']);
  
  return {
    apiKey: config.AT_API_KEY,
    username: config.AT_USERNAME,
    senderId: config.AT_SENDER_ID
  };
}

/**
 * Validates Database environment variables
 * @returns Object with validated database configuration
 * @throws Error if required database variables are missing
 */
export function validateDatabaseEnv(): {
  databaseUrl: string;
} {
  const config = validateFeatureEnv(['DATABASE_URL']);
  
  return {
    databaseUrl: config.DATABASE_URL
  };
}

/**
 * Validates Redis environment variables
 * @returns Object with validated Redis configuration
 * @throws Error if required Redis variables are missing
 */
export function validateRedisEnv(): {
  redisUrl: string;
} {
  const config = validateFeatureEnv(['REDIS_URL']);
  
  return {
    redisUrl: config.REDIS_URL
  };
}

/**
 * Validates Security environment variables
 * @returns Object with validated security configuration
 * @throws Error if required security variables are missing
 */
export function validateSecurityEnv(): {
  jwtSecret: string;
  encryptionKey: string;
} {
  const config = validateFeatureEnv(['JWT_SECRET', 'ENCRYPTION_KEY']);
  
  return {
    jwtSecret: config.JWT_SECRET,
    encryptionKey: config.ENCRYPTION_KEY
  };
}

// Export types for use in other modules
export type { EnvConfig }; 
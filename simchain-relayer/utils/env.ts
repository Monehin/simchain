/**
 * Environment validation utilities for SIMChain
 */

export function validateSolanaEnv(): void {
  // Check for required environment variables
  const requiredEnvVars = [
    'SOLANA_CLUSTER_URL',
    'WALLET_ADDRESS',
    'PROGRAM_ID'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
} 
#!/usr/bin/env node

const crypto = require('crypto');
const { Keypair } = require('@solana/web3.js');

console.log('🔐 Generating Environment Variables for SIMChain Production\n');

// Generate encryption key
const encryptionKey = crypto.randomBytes(32).toString('base64');

// Generate admin API key
const adminApiKey = `admin_${crypto.randomBytes(16).toString('hex')}`;

// Generate admin wallet
const adminWallet = Keypair.generate();

console.log('📋 Environment Variables for Vercel:\n');

console.log('🔑 ENCRYPTION_KEY:');
console.log('=====================================');
console.log(encryptionKey);
console.log('=====================================\n');

console.log('🔑 ADMIN_API_KEY:');
console.log('=====================================');
console.log(adminApiKey);
console.log('=====================================\n');

console.log('💰 ADMIN_WALLET_PRIVATE_KEY:');
console.log('=====================================');
console.log(adminWallet.secretKey.toString());
console.log('=====================================\n');

console.log('📍 ADMIN_WALLET_PUBLIC_KEY:');
console.log('=====================================');
console.log(adminWallet.publicKey.toString());
console.log('=====================================\n');

console.log('📝 Complete Environment Variables for Vercel:');
console.log('=====================================');
console.log(`DATABASE_URL=your_neon_database_url`);
console.log(`SOLANA_RPC_URL=https://api.devnet.solana.com`);
console.log(`PROGRAM_ID=DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r`);
console.log(`ADMIN_WALLET_PRIVATE_KEY=${adminWallet.secretKey.toString()}`);
console.log(`ENCRYPTION_KEY=${encryptionKey}`);
console.log(`ADMIN_API_KEY=${adminApiKey}`);
console.log('=====================================\n');

console.log('⚠️  IMPORTANT SECURITY NOTES:');
console.log('1. Keep these keys secure and never commit them to version control');
console.log('2. Add these to Vercel environment variables');
console.log('3. Fund the admin wallet with devnet SOL for program initialization');
console.log('4. Use different keys for development, staging, and production\n');

console.log('🚀 Next Steps:');
console.log('1. Add these variables to Vercel dashboard');
console.log('2. Fund admin wallet: solana airdrop 2 <PUBLIC_KEY>');
console.log('3. Deploy to Vercel');
console.log('4. Initialize program on devnet');

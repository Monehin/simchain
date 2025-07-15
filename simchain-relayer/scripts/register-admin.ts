import { Keypair, PublicKey } from '@solana/web3.js';
import { WalletDatabase } from '../src/lib/database';
import { SimchainClient } from '../src/lib/simchain-client';

async function registerAdminWallet() {
  try {
    // Get the program owner's wallet from environment
    const privateKeyString = process.env.WALLET_PRIVATE_KEY;
    if (!privateKeyString) {
      throw new Error('WALLET_PRIVATE_KEY not configured');
    }
    
    const privateKeyBytes = Uint8Array.from(JSON.parse(privateKeyString));
    const wallet = Keypair.fromSecretKey(privateKeyBytes);
    
    console.log('Program owner wallet address:', wallet.publicKey.toBase58());
    
    // Create a SIM number for the admin (you can change this)
    const adminSim = '+1234567890';
    
    // Initialize client to get wallet PDA
    const client = new SimchainClient({
      connection: { rpcEndpoint: process.env.SOLANA_CLUSTER_URL || 'http://127.0.0.1:8899' },
      programId: new PublicKey(process.env.PROGRAM_ID || 'DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r'),
      wallet,
      commitment: 'confirmed'
    });
    
    // Get wallet PDA for admin
    const [walletPDA] = await client.createWalletPDA(adminSim);
    console.log('Admin wallet PDA:', walletPDA.toBase58());
    
    // Register in database
    const walletRecord = await WalletDatabase.createWallet({
      sim: adminSim,
      walletAddress: walletPDA.toBase58(),
      country: 'US'
    });
    
    console.log('Admin wallet registered successfully!');
    console.log('Alias:', walletRecord.currentAlias);
    console.log('Wallet address:', walletRecord.walletAddress);
    
  } catch (error) {
    console.error('Failed to register admin wallet:', error);
  }
}

registerAdminWallet(); 
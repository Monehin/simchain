import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, web3 } from '@coral-xyz/anchor';
import { deriveWalletPDA, deriveMintRegistryPDA, deriveConfigPDA, deriveAliasIndexPDA } from './sim-utils';

// Import IDL
const IDL = require('../../simchain_wallet.json');

// Environment variables
const RPC_URL = process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899';
const PROGRAM_ID = process.env.PROGRAM_ID || 'DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r';

// Create connection
export const connection = new Connection(RPC_URL, 'confirmed');

// Create a mock keypair for the relayer (in production, this would be a real keypair)
const relayerKeypair = Keypair.generate();

// Create provider
export const provider = new AnchorProvider(
  connection,
  {
    publicKey: relayerKeypair.publicKey,
    signTransaction: async (tx) => {
      tx.sign(relayerKeypair);
      return tx;
    },
    signAllTransactions: async (txs) => {
      txs.forEach(tx => tx.sign(relayerKeypair));
      return txs;
    },
  },
  { commitment: 'confirmed' }
);

// Create program instance
export const program = new Program(IDL, new PublicKey(PROGRAM_ID), provider);

// Export program ID
export const programId = new PublicKey(PROGRAM_ID);

// Helper function to get the current salt from config
export async function getCurrentSalt(): Promise<Uint8Array> {
  try {
    const [configPda] = deriveConfigPDA(programId);
    // For now, return hardcoded salt since config account might not exist
    return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  } catch (error) {
    // Fallback to hardcoded salt for demo
    console.warn('Could not fetch salt from config, using hardcoded salt');
    return new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  }
} 
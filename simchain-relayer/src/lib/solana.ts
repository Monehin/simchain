import { Connection, PublicKey } from '@solana/web3.js';

// Connect to local Solana validator
export const connection = new Connection('http://127.0.0.1:8899', 'confirmed');

// SIMChain program ID (from the deployed program)
export const programId = new PublicKey('DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r');

// Default salt for wallet derivation (should match the one used in the program)
export const defaultSalt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]); 
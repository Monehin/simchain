import { PublicKey } from '@solana/web3.js';
import { createHash } from 'crypto';

/**
 * Hash a SIM number using SHA256
 * @param sim - The SIM number string
 * @param salt - The salt bytes
 * @returns 32-byte hash
 */
export function hashSimNumber(sim: string, salt: Uint8Array): Uint8Array {
  const hash = createHash('sha256');
  hash.update(sim);
  hash.update(salt);
  return new Uint8Array(hash.digest());
}

/**
 * Derive wallet PDA from SIM number and salt
 * @param sim - The SIM number string
 * @param salt - The salt bytes
 * @param programId - The program ID
 * @returns [PublicKey, bump]
 */
export function deriveWalletPDA(
  sim: string, 
  salt: Uint8Array, 
  programId: PublicKey
): [PublicKey, number] {
  const simHash = hashSimNumber(sim, salt);
  return PublicKey.findProgramAddressSync(
    [Buffer.from('wallet'), simHash],
    programId
  );
}

/**
 * Derive mint registry PDA
 * @param programId - The program ID
 * @returns [PublicKey, bump]
 */
export function deriveMintRegistryPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint_registry')],
    programId
  );
}

/**
 * Derive config PDA
 * @param programId - The program ID
 * @returns [PublicKey, bump]
 */
export function deriveConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    programId
  );
}

/**
 * Derive alias index PDA
 * @param alias - The alias bytes
 * @param programId - The program ID
 * @returns [PublicKey, number]
 */
export function deriveAliasIndexPDA(
  alias: Uint8Array, 
  programId: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('alias'), alias],
    programId
  );
}

/**
 * Convert string to bytes for PIN hashing
 * @param pin - The PIN string
 * @returns 32-byte array
 */
export function pinToBytes(pin: string): Uint8Array {
  const hash = createHash('sha256');
  hash.update(pin);
  return new Uint8Array(hash.digest());
}

/**
 * Validate PIN strength
 * @param pin - The PIN string
 * @returns true if valid
 */
export function validatePin(pin: string): boolean {
  // Must be at least 8 characters with mix of letters and numbers
  return pin.length >= 8 && /[a-zA-Z]/.test(pin) && /\d/.test(pin);
}

/**
 * Format SOL amount for display
 * @param lamports - Amount in lamports
 * @returns Formatted string
 */
export function formatSOL(lamports: number): string {
  return (lamports / 1e9).toFixed(4);
}

/**
 * Parse SOL amount from string
 * @param sol - Amount in SOL
 * @returns Amount in lamports
 */
export function parseSOL(sol: string): number {
  return Math.floor(parseFloat(sol) * 1e9);
} 
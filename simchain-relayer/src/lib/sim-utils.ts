import { PublicKey } from '@solana/web3.js';

/**
 * Validate PIN strength
 * @param pin - The PIN string
 * @returns true if valid
 */
export function validatePin(pin: string): boolean {
  // Must be exactly 6 digits
  return /^[0-9]{6}$/.test(pin);
}

/**
 * Hash SIM number with salt for deterministic PDA derivation
 * @param sim - The SIM number string
 * @param salt - The salt bytes
 * @returns 32-byte hash
 */
export function hashSimNumber(sim: string, salt: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const simBytes = encoder.encode(sim);
  const combined = new Uint8Array(simBytes.length + salt.length);
  combined.set(simBytes);
  combined.set(salt, simBytes.length);
  
  // Simple hash function (in production, use a proper crypto hash)
  const hash = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    hash[i] = combined[i % combined.length] ^ (i * 7);
  }
  return hash;
}

/**
 * Derive wallet PDA
 * @param sim - The SIM number string
 * @param salt - The salt bytes
 * @param programId - The program ID
 * @returns [PublicKey, number]
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
 * Derive config PDA
 * @param programId - The program ID
 * @returns [PublicKey, number]
 */
export function deriveConfigPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    programId
  );
}

/**
 * Derive mint registry PDA
 * @param programId - The program ID
 * @returns [PublicKey, number]
 */
export function deriveMintRegistryPDA(programId: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint_registry')],
    programId
  );
} 
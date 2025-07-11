import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { deriveWalletPDA, validatePin } from './sim-utils';
import * as crypto from 'crypto';

export interface SimchainClientConfig {
  connection: Connection;
  wallet: Keypair;
  programId: PublicKey;
}

export class SimchainClient {
  private connection: Connection;
  private wallet: Keypair;
  private programId: PublicKey;

  constructor(config: SimchainClientConfig) {
    this.connection = config.connection;
    this.wallet = config.wallet;
    this.programId = config.programId;
  }

  /**
   * Validate PIN and return hash
   */
  private hashPin(pin: string): Uint8Array {
    if (!validatePin(pin)) {
      throw new Error('PIN must be exactly 6 digits');
    }
    return crypto.createHash('sha256').update(pin).digest();
  }

  /**
   * Derive wallet PDA
   */
  async deriveWalletPDA(sim: string): Promise<[PublicKey, number]> {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    return deriveWalletPDA(sim, salt, this.programId);
  }

  /**
   * Check if wallet exists
   */
  async walletExists(sim: string): Promise<boolean> {
    try {
      const [walletPda] = await this.deriveWalletPDA(sim);
      const accountInfo = await this.connection.getAccountInfo(walletPda);
      return accountInfo !== null;
    } catch {
      return false;
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(sim: string): Promise<number> {
    const [walletPda] = await this.deriveWalletPDA(sim);
    const balance = await this.connection.getBalance(walletPda);
    return balance / LAMPORTS_PER_SOL;
  }

  /**
   * Create a simple transaction to test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get program info
   */
  async getProgramInfo(): Promise<{ programId: string; exists: boolean }> {
    try {
      const accountInfo = await this.connection.getAccountInfo(this.programId);
      return {
        programId: this.programId.toBase58(),
        exists: accountInfo !== null
      };
    } catch {
      return {
        programId: this.programId.toBase58(),
        exists: false
      };
    }
  }
} 
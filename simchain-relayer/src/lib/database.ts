import { PrismaClient } from '../generated/prisma';
import { PhoneEncryption } from './encryption';
import { AliasGenerator } from './alias-generator';

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export interface CreateWalletData {
  sim: string;
  walletAddress: string;
  country?: string;
  customAlias?: string; // Optional custom alias, will generate if not provided
}

export interface UpdateWalletData {
  alias?: string;
  lastBalance?: number;
}

export interface WalletRecord {
  id: string;
  encryptedSim: string;
  walletAddress: string;
  country: string;
  alias: string | null;
  lastBalance?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class WalletDatabase {
  /**
   * Create a new encrypted wallet record
   */
  static async createWallet(data: CreateWalletData): Promise<WalletRecord> {
    try {
      // Validate phone number
      if (!PhoneEncryption.validatePhoneNumber(data.sim)) {
        throw new Error('Invalid phone number format');
      }

      // Encrypt the phone number
      const encryptedSim = PhoneEncryption.encrypt(data.sim);
      
      // Create hash for lookup
      const simHash = PhoneEncryption.createHash(data.sim);

      // Check if wallet already exists
      const existingWallet = await prisma.encryptedWallet.findUnique({
        where: { walletAddress: data.walletAddress }
      });

      if (existingWallet) {
        throw new Error('Wallet already exists');
      }

      // Generate or validate alias
      let finalAlias: string;
      if (data.customAlias) {
        // Validate custom alias format
        const validation = AliasGenerator.validateAliasFormat(data.customAlias);
        if (!validation.isValid) {
          throw new Error(validation.error || 'Invalid alias format');
        }

        // Check if custom alias is available
        const isAvailable = await AliasGenerator.isAliasAvailable(data.customAlias);
        if (!isAvailable) {
          throw new Error('Alias is already taken');
        }

        finalAlias = data.customAlias;
      } else {
        // Generate unique alias
        finalAlias = await AliasGenerator.generateUniqueAlias();
      }

      // Create the wallet record
      const wallet = await prisma.encryptedWallet.create({
        data: {
          encryptedSim,
          simHash,
          walletAddress: data.walletAddress,
          country: data.country || 'RW',
          alias: finalAlias,
          lastBalance: 0
        }
      });

      // Note: Alias history tracking removed - using audit logs instead

      return wallet;
    } catch (error) {
      console.error('Failed to create wallet record:', error);
      throw error;
    }
  }

  /**
   * Find wallet by phone number hash
   */
  static async findWalletBySim(sim: string): Promise<WalletRecord | null> {
    try {
      // Validate phone number
      if (!PhoneEncryption.validatePhoneNumber(sim)) {
        throw new Error('Invalid phone number format');
      }

      // Create hash for lookup (consistent)
      const simHash = PhoneEncryption.createHash(sim);

      const wallet = await prisma.encryptedWallet.findFirst({
        where: { simHash }
      });

      return wallet;
    } catch (error) {
      console.error('Failed to find wallet by SIM:', error);
      return null;
    }
  }

  /**
   * Find wallet by wallet address
   */
  static async findWalletByAddress(walletAddress: string): Promise<WalletRecord | null> {
    try {
      const wallet = await prisma.encryptedWallet.findUnique({
        where: { walletAddress }
      });

      return wallet;
    } catch (error) {
      console.error('Failed to find wallet by address:', error);
      return null;
    }
  }

  /**
   * Update wallet information
   */
  static async updateWallet(walletAddress: string, data: UpdateWalletData): Promise<WalletRecord> {
    try {
      const wallet = await prisma.encryptedWallet.update({
        where: { walletAddress },
        data
      });

      return wallet;
    } catch (error) {
      console.error('Failed to update wallet:', error);
      throw error;
    }
  }

  /**
   * Update wallet alias by phone number
   */
  static async updateWalletAlias(sim: string, alias: string): Promise<WalletRecord> {
    try {
      // Find wallet by phone number hash
      const simHash = PhoneEncryption.createHash(sim);
      
      const wallet = await prisma.encryptedWallet.update({
        where: { simHash },
        data: { alias: alias }
      });

      return wallet;
    } catch (error) {
      console.error('Failed to update wallet alias:', error);
      throw error;
    }
  }

  // Transaction recording removed - using audit logs instead

  /**
   * Check if a phone number is already registered
   */
  static async isPhoneNumberRegistered(sim: string): Promise<boolean> {
    try {
      const wallet = await this.findWalletBySim(sim);
      return wallet !== null;
    } catch (error) {
      console.error('Failed to check phone number registration:', error);
      return false;
    }
  }

  /**
   * Get wallet statistics
   */
  static async getWalletStats() {
    try {
      const totalWallets = await prisma.encryptedWallet.count();

      return {
        totalWallets,
        totalErrors: 0, // Error tracking moved to audit logs
        errorRate: 0
      };
    } catch (error) {
      console.error('Failed to get wallet stats:', error);
      return {
        totalWallets: 0,
        totalErrors: 0,
        errorRate: 0
      };
    }
  }
} 
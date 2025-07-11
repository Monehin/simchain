import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface WalletMappingData {
  simNumber: string;
  walletAddress: string;
  ownerAddress: string;
  simHash: string;
  alias?: string;
}

export interface AliasUpdateData {
  walletAddress: string;
  oldAlias?: string;
  newAlias?: string;
  changedBy: string;
}

export class DatabaseService {
  /**
   * Create a new wallet mapping
   */
  static async createWalletMapping(data: WalletMappingData) {
    try {
      return await prisma.walletMapping.create({
        data: {
          simNumber: data.simNumber,
          walletAddress: data.walletAddress,
          ownerAddress: data.ownerAddress,
          simHash: data.simHash,
          alias: data.alias,
        },
      });
    } catch (error) {
      console.error('Error creating wallet mapping:', error);
      throw error;
    }
  }

  /**
   * Get wallet mapping by SIM number
   */
  static async getWalletBySimNumber(simNumber: string) {
    try {
      return await prisma.walletMapping.findUnique({
        where: { simNumber },
      });
    } catch (error) {
      console.error('Error getting wallet by SIM number:', error);
      throw error;
    }
  }

  /**
   * Get wallet mapping by wallet address
   */
  static async getWalletByAddress(walletAddress: string) {
    try {
      return await prisma.walletMapping.findUnique({
        where: { walletAddress },
      });
    } catch (error) {
      console.error('Error getting wallet by address:', error);
      throw error;
    }
  }

  /**
   * Update wallet alias
   */
  static async updateWalletAlias(walletAddress: string, newAlias: string, changedBy: string = 'user') {
    try {
      // Get current wallet mapping
      const wallet = await prisma.walletMapping.findUnique({
        where: { walletAddress },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Start a transaction
      return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update the wallet mapping
        const updatedWallet = await tx.walletMapping.update({
          where: { walletAddress },
          data: { alias: newAlias },
        });

        // Record the alias change in history
        await tx.aliasHistory.create({
          data: {
            walletAddress,
            oldAlias: wallet.alias,
            newAlias,
            changedBy,
          },
        });

        return updatedWallet;
      });
    } catch (error) {
      console.error('Error updating wallet alias:', error);
      throw error;
    }
  }

  /**
   * Get all wallet mappings (for admin)
   */
  static async getAllWallets() {
    try {
      return await prisma.walletMapping.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting all wallets:', error);
      throw error;
    }
  }

  /**
   * Get wallet count
   */
  static async getWalletCount() {
    try {
      return await prisma.walletMapping.count();
    } catch (error) {
      console.error('Error getting wallet count:', error);
      throw error;
    }
  }

  /**
   * Check if alias is already in use
   */
  static async isAliasInUse(alias: string) {
    try {
      const existing = await prisma.walletMapping.findFirst({
        where: { alias },
      });
      return !!existing;
    } catch (error) {
      console.error('Error checking alias usage:', error);
      throw error;
    }
  }

  /**
   * Get alias history for a wallet
   */
  static async getAliasHistory(walletAddress: string) {
    try {
      return await prisma.aliasHistory.findMany({
        where: { walletAddress },
        orderBy: { changedAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting alias history:', error);
      throw error;
    }
  }

  /**
   * Delete wallet mapping (for cleanup)
   */
  static async deleteWalletMapping(walletAddress: string) {
    try {
      return await prisma.walletMapping.delete({
        where: { walletAddress },
      });
    } catch (error) {
      console.error('Error deleting wallet mapping:', error);
      throw error;
    }
  }
} 
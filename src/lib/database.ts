import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';
import { createHash } from 'crypto';

// Global Prisma client instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database service for phone number and wallet management
export class DatabaseService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  // Hash phone number for secure storage
  private hashPhoneNumber(phoneNumber: string): string {
    return createHash('sha256').update(phoneNumber).digest('hex');
  }

  // Create or update phone wallet mapping
  async createPhoneWalletMapping(params: {
    phoneNumber: string;
    walletAddress: string;
    simHash: string;
    country?: string;
  }) {
    const { phoneNumber, walletAddress, simHash, country = 'RW' } = params;
    const phoneHash = this.hashPhoneNumber(phoneNumber);

    try {
      const mapping = await this.prisma.phoneWalletMapping.upsert({
        where: {
          phoneHash,
        },
        update: {
          walletAddress,
          simHash,
          country,
          phoneNumber, // Update phone number in case it changed
          updatedAt: new Date(),
        },
        create: {
          phoneHash,
          phoneNumber,
          walletAddress,
          simHash,
          country,
        },
      });

      return mapping;
    } catch (error) {
      console.error('Error creating phone wallet mapping:', error);
      throw new Error('Failed to create phone wallet mapping');
    }
  }

  // Get wallet address by phone number
  async getWalletByPhone(phoneNumber: string) {
    const phoneHash = this.hashPhoneNumber(phoneNumber);

    try {
      const mapping = await this.prisma.phoneWalletMapping.findUnique({
        where: {
          phoneHash,
        },
      });

      return mapping;
    } catch (error) {
      console.error('Error getting wallet by phone:', error);
      throw new Error('Failed to get wallet by phone number');
    }
  }

  // Get phone number by wallet address
  async getPhoneByWallet(walletAddress: string) {
    try {
      const mapping = await this.prisma.phoneWalletMapping.findUnique({
        where: {
          walletAddress,
        },
      });

      return mapping;
    } catch (error) {
      console.error('Error getting phone by wallet:', error);
      throw new Error('Failed to get phone by wallet address');
    }
  }

  // Record transaction in database
  async recordTransaction(params: {
    signature: string;
    type: TransactionType;
    fromWallet?: string;
    toWallet?: string;
    amount: bigint;
    phoneWalletMappingId?: string;
  }) {
    const { signature, type, fromWallet, toWallet, amount, phoneWalletMappingId } = params;

    try {
      const transaction = await this.prisma.transaction.create({
        data: {
          signature,
          type,
          fromWallet,
          toWallet,
          amount,
          phoneWalletMappingId,
          status: TransactionStatus.PENDING,
        },
      });

      return transaction;
    } catch (error) {
      console.error('Error recording transaction:', error);
      throw new Error('Failed to record transaction');
    }
  }

  // Update transaction status
  async updateTransactionStatus(signature: string, status: TransactionStatus) {
    try {
      const transaction = await this.prisma.transaction.update({
        where: {
          signature,
        },
        data: {
          status,
          updatedAt: new Date(),
        },
      });

      return transaction;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw new Error('Failed to update transaction status');
    }
  }

  // Create or update alias mapping
  async setAlias(params: {
    alias: string;
    walletAddress: string;
    phoneHash: string;
  }) {
    const { alias, walletAddress, phoneHash } = params;

    try {
      const aliasMapping = await this.prisma.aliasMapping.upsert({
        where: {
          alias,
        },
        update: {
          walletAddress,
          phoneHash,
          updatedAt: new Date(),
        },
        create: {
          alias,
          walletAddress,
          phoneHash,
        },
      });

      return aliasMapping;
    } catch (error) {
      console.error('Error setting alias:', error);
      throw new Error('Failed to set alias');
    }
  }

  // Get wallet by alias
  async getWalletByAlias(alias: string) {
    try {
      const aliasMapping = await this.prisma.aliasMapping.findUnique({
        where: {
          alias,
        },
        include: {
          // Include phone wallet mapping for additional context
        },
      });

      return aliasMapping;
    } catch (error) {
      console.error('Error getting wallet by alias:', error);
      throw new Error('Failed to get wallet by alias');
    }
  }

  // Get transaction history for a wallet
  async getTransactionHistory(walletAddress: string, limit = 50) {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          OR: [
            { fromWallet: walletAddress },
            { toWallet: walletAddress },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      return transactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw new Error('Failed to get transaction history');
    }
  }

  // Get wallet statistics
  async getWalletStats(walletAddress: string) {
    try {
      const [totalTransactions, confirmedTransactions, totalReceived, totalSent] = await Promise.all([
        this.prisma.transaction.count({
          where: {
            OR: [
              { fromWallet: walletAddress },
              { toWallet: walletAddress },
            ],
          },
        }),
        this.prisma.transaction.count({
          where: {
            OR: [
              { fromWallet: walletAddress },
              { toWallet: walletAddress },
            ],
            status: TransactionStatus.CONFIRMED,
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            toWallet: walletAddress,
            status: TransactionStatus.CONFIRMED,
          },
          _sum: {
            amount: true,
          },
        }),
        this.prisma.transaction.aggregate({
          where: {
            fromWallet: walletAddress,
            status: TransactionStatus.CONFIRMED,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      return {
        totalTransactions,
        confirmedTransactions,
        totalReceived: totalReceived._sum.amount || BigInt(0),
        totalSent: totalSent._sum.amount || BigInt(0),
      };
    } catch (error) {
      console.error('Error getting wallet stats:', error);
      throw new Error('Failed to get wallet statistics');
    }
  }

  // Search wallets by phone number pattern (for admin purposes)
  async searchWalletsByPhone(phonePattern: string, limit = 20) {
    try {
      const mappings = await this.prisma.phoneWalletMapping.findMany({
        where: {
          phoneNumber: {
            contains: phonePattern,
            mode: 'insensitive',
          },
          isActive: true,
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return mappings;
    } catch (error) {
      console.error('Error searching wallets by phone:', error);
      throw new Error('Failed to search wallets by phone');
    }
  }

  // Deactivate wallet mapping (soft delete)
  async deactivateWallet(walletAddress: string) {
    try {
      const mapping = await this.prisma.phoneWalletMapping.update({
        where: {
          walletAddress,
        },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      });

      return mapping;
    } catch (error) {
      console.error('Error deactivating wallet:', error);
      throw new Error('Failed to deactivate wallet');
    }
  }

  // Health check for database connection
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService(); 
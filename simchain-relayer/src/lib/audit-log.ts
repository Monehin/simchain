import { prisma } from './database';
import { WalletDatabase } from './database';

export interface ErrorLogEntry {
  action: string;
  alias?: string;
  errorMessage: string;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

export class ErrorLogger {
  /**
   * Get user alias from phone number (for logging)
   */
  private static async getAliasForLogging(sim: string): Promise<string | undefined> {
    try {
      const wallet = await WalletDatabase.findWalletBySim(sim);
      return wallet?.alias || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Log an error
   */
  static async log(entry: ErrorLogEntry): Promise<void> {
    try {
      await prisma.errorLog.create({
        data: {
          action: entry.action,
          alias: entry.alias,
          errorMessage: entry.errorMessage,
          errorCode: entry.errorCode,
          metadata: entry.metadata,
        }
      });
    } catch (error) {
      // Don't fail the main operation if error logging fails
      console.error('Error logging failed:', error);
    }
  }

  /**
   * Log wallet creation error
   */
  static async logWalletCreationError(sim: string, errorMessage: string, errorCode?: string, metadata?: Record<string, unknown>): Promise<void> {
    const alias = await this.getAliasForLogging(sim);
    await this.log({
      action: 'CREATE_WALLET',
      alias,
      errorMessage,
      errorCode,
      metadata
    });
  }

  /**
   * Log fund transfer error
   */
  static async logFundTransferError(fromSim: string, toSim: string, amount: number, lamports: number, errorMessage: string, errorCode?: string, metadata?: Record<string, unknown>): Promise<void> {
    const fromAlias = await this.getAliasForLogging(fromSim);
    const toAlias = await this.getAliasForLogging(toSim);
    
    await this.log({
      action: 'SEND_FUNDS',
      alias: fromAlias,
      errorMessage,
      errorCode,
      metadata: {
        ...metadata,
        toAlias,
        amount,
        lamports
      }
    });
  }

  /**
   * Log fund deposit error
   */
  static async logFundDepositError(sim: string, amount: number, lamports: number, errorMessage: string, errorCode?: string, metadata?: Record<string, unknown>): Promise<void> {
    const alias = await this.getAliasForLogging(sim);
    
    await this.log({
      action: 'DEPOSIT_FUNDS',
      alias,
      errorMessage,
      errorCode,
      metadata: {
        ...metadata,
        amount,
        lamports
      }
    });
  }

  /**
   * Log balance check error
   */
  static async logBalanceCheckError(sim: string, errorMessage: string, errorCode?: string, metadata?: Record<string, unknown>): Promise<void> {
    const alias = await this.getAliasForLogging(sim);
    
    await this.log({
      action: 'CHECK_BALANCE',
      alias,
      errorMessage,
      errorCode,
      metadata
    });
  }

  /**
   * Log alias setting error
   */
  static async logAliasSetError(sim: string, alias: string, errorMessage: string, errorCode?: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.log({
      action: 'SET_ALIAS',
      alias,
      errorMessage,
      errorCode,
      metadata
    });
  }

  /**
   * Get error logs for a specific alias
   */
  static async getAliasErrors(alias: string, limit: number = 50): Promise<unknown[]> {
    try {
      return await prisma.errorLog.findMany({
        where: { alias },
        orderBy: { createdAt: 'desc' },
        take: limit
      });
    } catch (error) {
      console.error('Failed to get alias errors:', error);
      return [];
    }
  }

  /**
   * Get system error statistics
   */
  static async getErrorStats(): Promise<{
    totalWallets: number;
    totalErrors: number;
    errorRate: number;
    recentErrors: unknown[];
  }> {
    try {
      const totalWallets = await prisma.encryptedWallet.count();
      const totalErrors = await prisma.errorLog.count();

      const recentErrors = await prisma.errorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          action: true,
          errorCode: true,
          createdAt: true,
          alias: true
        }
      });

      return {
        totalWallets,
        totalErrors,
        errorRate: totalWallets > 0 ? (totalErrors / totalWallets) * 100 : 0,
        recentErrors
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalWallets: 0,
        totalErrors: 0,
        errorRate: 0,
        recentErrors: []
      };
    }
  }
} 
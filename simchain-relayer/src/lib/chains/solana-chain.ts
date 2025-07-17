import { BaseChain, ChainConfig, ChainTransaction, ChainWallet } from './base-chain';
import { SimchainClient, SimchainClientConfig } from '../simchain-client';
import { Keypair, PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '../../config/programId';

export class SolanaChain extends BaseChain {
  private client: SimchainClient;
  private wallet: Keypair;

  constructor(config: ChainConfig) {
    super(config);
    
    // Create a new keypair for the relayer wallet
    this.wallet = Keypair.generate();
    
    // Configure the SimchainClient
    const clientConfig: SimchainClientConfig = {
      connection: {
        rpcEndpoint: config.rpcUrl,
      },
      programId: new PublicKey(PROGRAM_ID),
      wallet: this.wallet,
      commitment: 'confirmed',
    };

    this.client = new SimchainClient(clientConfig);
  }

  async initializeWallet(sim: string, pin: string): Promise<string> {
    try {
      // Use the existing relay method which handles all the complexity
      const result = await this.client.initializeWalletRelay(sim, pin, 'US');
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to initialize wallet');
      }

      return result.data.walletAddress;
    } catch (error) {
      console.error('Error initializing Solana wallet:', error);
      throw error;
    }
  }

  async sendFunds(from: string, to: string, amount: string, pin: string): Promise<ChainTransaction> {
    try {
      // Convert amount string to number (assuming SOL amounts)
      const amountNumber = parseFloat(amount);
      
      // Use the existing relay method
      const result = await this.client.sendFundsRelay(from, to, amountNumber, pin, 'US');
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to send funds');
      }

      return {
        hash: result.signature || result.data.signature,
        from,
        to,
        amount,
        status: 'confirmed',
      };
    } catch (error) {
      console.error('Error sending Solana funds:', error);
      throw error;
    }
  }

  async checkBalance(sim: string, pin: string): Promise<string> {
    try {
      // Use the existing relay method
      const result = await this.client.checkBalanceRelay(sim, pin, 'US');
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to check balance');
      }

      // Convert balance to string with proper decimals
      return result.data.balance.toString();
    } catch (error) {
      console.error('Error checking Solana balance:', error);
      throw error;
    }
  }

  async setAlias(sim: string, alias: string, pin: string): Promise<boolean> {
    try {
      // Use the existing relay method
      const result = await this.client.setAliasRelay(sim, pin, alias, 'US');
      
      if (!result.success || !result.data) {
        throw new Error(result.error?.message || 'Failed to set alias');
      }

      return true;
    } catch (error) {
      console.error('Error setting Solana alias:', error);
      throw error;
    }
  }

  async validatePin(sim: string, pin: string): Promise<boolean> {
    try {
      // Use the existing relay method
      const result = await this.client.validatePinRelay(sim, pin, 'US');
      
      if (!result.success || !result.data) {
        return false;
      }

      return result.data.isValid;
    } catch (error) {
      console.error('Error validating Solana PIN:', error);
      return false;
    }
  }

  // Additional Solana-specific methods that might be useful
  async getWalletInfo(sim: string): Promise<ChainWallet> {
    try {
      const walletInfo = await this.client.getWalletInfo(sim);
      
      return {
        address: walletInfo.address,
        balance: walletInfo.balance.toString(),
        exists: walletInfo.exists,
        alias: walletInfo.alias,
      };
    } catch (error) {
      console.error('Error getting Solana wallet info:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    return await this.client.testConnection();
  }
} 
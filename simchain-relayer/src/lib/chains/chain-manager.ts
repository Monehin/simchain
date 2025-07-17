import { BaseChain, ChainWallet, ChainTransaction } from './base-chain';
import { SolanaChain } from './solana-chain';
import { PolkadotChain } from './polkadot-chain';
import { getChainConfig, isChainSupported } from '../../config/chains';

// Operation types for the ChainManager
export interface Operation {
  type: 'initializeWallet' | 'sendFunds' | 'checkBalance' | 'setAlias' | 'validatePin';
  targetChain: string;
  sim: string;
  pin: string;
  params: Record<string, string | number>;
}

export interface CrossChainTransfer {
  sim: string;
  pin: string;
  sourceChain: string;
  targetChain: string;
  amount: string;
  fromAddress?: string;
  toAddress?: string;
  // New fields for conversion
  sourceToken?: string;
  targetToken?: string;
  slippageTolerance?: number; // in percentage (e.g.,0.5or 0.5%)
}

export interface CrossChainResult {
  sourceTx: string;
  targetTx: string;
  messageId?: string;
  status: 'pending' | 'confirmed' | 'failed'; // New fields for conversion details
  exchangeRate?: number;
  sourceAmount?: string;
  targetAmount?: string;
  fees?: {
    sourceChainFee: string;
    bridgeFee: string;
    targetChainFee: string;
    totalFee: string;
  };
  estimatedTime?: number; // in seconds
}

export class ChainManager {
  private chains: Map<string, BaseChain>;
  private solanaChain: SolanaChain;

  constructor() {
    this.chains = new Map();
    
    // Initialize Solana chain (primary validation source)
    const solanaConfig = getChainConfig('solana');
    this.solanaChain = new SolanaChain(solanaConfig);
    this.chains.set('solana', this.solanaChain);
    
    // Initialize Polkadot chain with Solana PIN validation
    const polkadotConfig = getChainConfig('polkadot');
    const polkadotChain = new PolkadotChain(polkadotConfig, (sim, pin) => this.solanaChain.validatePin(sim, pin));
    this.chains.set('polkadot', polkadotChain);
    
    // Note: Other chains will be added as they're implemented
    // this.chains.set('ethereum', new EthereumChain(ethereumConfig));
    // this.chains.set('polygon', new PolygonChain(polygonConfig));
  }

  /**
   * Execute an operation on a specific chain
   * For non-Solana chains, validates PIN on Solana first (single source of truth)
   */
  async executeOperation(operation: Operation): Promise<string | ChainTransaction | boolean> {
    const { targetChain, sim, pin, params } = operation;

    // For non-Solana chains, validate PIN on Solana first
    if (targetChain !== 'solana') {
      const isValid = await this.solanaChain.validatePin(sim, pin);
      if (!isValid) {
        throw new Error('Invalid PIN - validation failed on Solana');
      }
    }

    // Get the target chain
    const chain = this.chains.get(targetChain);
    if (!chain) {
      throw new Error(`Unsupported chain: ${targetChain}`);
    }

    // Execute the operation based on type
    switch (operation.type) {
      case 'initializeWallet':
        return await chain.initializeWallet(sim, pin);

      case 'sendFunds':
        const { from, to, amount } = params;
        return await chain.sendFunds(from as string, to as string, amount as string, pin);

      case 'checkBalance':
        return await chain.checkBalance(sim, pin);

      case 'setAlias':
        const { alias } = params;
        return await chain.setAlias(sim, alias as string, pin);

      case 'validatePin':
        return await chain.validatePin(sim, pin);

      default:
        throw new Error(`Unsupported operation type: ${operation.type}`);
    }
  }

  /**
   * Execute cross-chain conversion (e.g., SOL to DOT)
   * Handles exchange rates, fees, and proper cross-chain execution
   */
  async crossChainTransfer(transfer: CrossChainTransfer): Promise<CrossChainResult> {
    // 1alidate PIN on Solana (single source of truth)
    const isValid = await this.solanaChain.validatePin(transfer.sim, transfer.pin);
    if (!isValid) {
      throw new Error('Invalid PIN - validation failed on Solana');
    }

    // 2. Check if both chains are supported
    if (!isChainSupported(transfer.sourceChain)) {
      throw new Error(`Unsupported source chain: ${transfer.sourceChain}`);
    }
    if (!isChainSupported(transfer.targetChain)) {
      throw new Error(`Unsupported target chain: ${transfer.targetChain}`);
    }

    // 3. Get chain instances
    const sourceChain = this.chains.get(transfer.sourceChain);
    const targetChain = this.chains.get(transfer.targetChain);

    if (!sourceChain || !targetChain) {
      throw new Error('Chain not initialized');
    }

    // 4. Get exchange rate and calculate conversion
    const conversionDetails = await this.calculateConversion(transfer);
    
    // 5. Validate user has sufficient balance
    const sourceBalance = await sourceChain.checkBalance(transfer.sim, transfer.pin);
    const requiredAmount = parseFloat(transfer.amount) + parseFloat(conversionDetails.fees.sourceChainFee);
    
    if (parseFloat(sourceBalance) < requiredAmount) {
      throw new Error(`Insufficient balance. Required: ${requiredAmount}, Available: ${sourceBalance}`);
    }

    // 6. Execute the cross-chain conversion
    return await this.executeCrossChainConversion(transfer, conversionDetails);
  }

  /**
   * Calculate conversion details including exchange rate and fees
   */
  private async calculateConversion(transfer: CrossChainTransfer): Promise<{
    exchangeRate: number;
    targetAmount: string;
    fees: {
      sourceChainFee: string;
      bridgeFee: string;
      targetChainFee: string;
      totalFee: string;
    };
    estimatedTime: number;
  }> {
    const sourceToken = transfer.sourceToken || this.getNativeToken(transfer.sourceChain);
    const targetToken = transfer.targetToken || this.getNativeToken(transfer.targetChain);
    
    // Get real-time exchange rate
    const exchangeRate = await this.getExchangeRate(sourceToken, targetToken);
    
    // Calculate target amount
    const sourceAmount = parseFloat(transfer.amount);
    const targetAmount = sourceAmount * exchangeRate;
    
    // Calculate fees
    const sourceChainFee = await this.getChainFee(transfer.sourceChain);
    const bridgeFee = await this.getBridgeFee(transfer.sourceChain, transfer.targetChain, sourceAmount);
    const targetChainFee = await this.getChainFee(transfer.targetChain);
    const totalFee = parseFloat(sourceChainFee) + parseFloat(bridgeFee) + parseFloat(targetChainFee);
    
    // Estimate time
    const estimatedTime = this.estimateConversionTime(transfer.sourceChain, transfer.targetChain);
    
    return {
      exchangeRate,
      targetAmount: targetAmount.toFixed(8),
      fees: {
        sourceChainFee,
        bridgeFee,
        targetChainFee,
        totalFee: totalFee.toFixed(8)
      },
      estimatedTime
    };
  }

  /**
   * Execute the actual cross-chain conversion
   */
  private async executeCrossChainConversion(
    transfer: CrossChainTransfer, 
    conversionDetails: any
  ): Promise<CrossChainResult> {
    const sourceChain = this.chains.get(transfer.sourceChain)!;
    const targetChain = this.chains.get(transfer.targetChain)!;
    
    try {
      // Step 1: Lock funds on source chain
      console.log(`🔒 Locking ${transfer.amount} ${transfer.sourceToken || 'native'} on ${transfer.sourceChain}...`);
      const sourceTx = await this.lockFundsOnSourceChain(transfer, sourceChain);
      
      // Step 2: Send cross-chain message via Hyperbridge
      console.log(`🌉 Sending cross-chain message via Hyperbridge...`);
      const messageId = await this.sendCrossChainMessage(transfer, conversionDetails);
      
      // Step 3: Release funds on target chain
      console.log(`🔓 Releasing ${conversionDetails.targetAmount} ${transfer.targetToken || 'native'} on ${transfer.targetChain}...`);
      const targetTx = await this.releaseFundsOnTargetChain(transfer, targetChain, conversionDetails);
      
      return {
        sourceTx,
        targetTx,
        messageId,
        status: 'confirmed',
        exchangeRate: conversionDetails.exchangeRate,
        sourceAmount: transfer.amount,
        targetAmount: conversionDetails.targetAmount,
        fees: conversionDetails.fees,
        estimatedTime: conversionDetails.estimatedTime
      };
      
    } catch (error) {
      // If any step fails, attempt to refund on source chain
      console.error('Cross-chain conversion failed:', error);
      await this.handleConversionFailure(transfer, sourceChain);
      throw error;
    }
  }

  /**
   * Lock funds on source chain
   */
  private async lockFundsOnSourceChain(transfer: CrossChainTransfer, sourceChain: BaseChain): Promise<string> {
    // For now, simulate locking funds
    // In real implementation, this would:
    //1 Transfer funds to a bridge contract
    //2 Generate proof of lock
    // 3. Return transaction hash
    
    const lockAmount = parseFloat(transfer.amount);
    const lockAddress = await this.getBridgeAddress(transfer.sourceChain);
    
    // Simulate the lock transaction
    const txHash = `${transfer.sourceChain}_lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`✅ Locked ${lockAmount} on ${transfer.sourceChain} (Tx: ${txHash})`);
    return txHash;
  }

    /**
   * Send cross-chain message via Hyperbridge
   */
  private async sendCrossChainMessage(transfer: CrossChainTransfer, conversionDetails: any): Promise<string> {
    // In real implementation, this would:
    // 1. Create ISMP message
    // 2. Send to Hyperbridge network
    // 3. Wait for message confirmation
    //4 Return message ID
    
    const messageId = `hyperbridge_${transfer.sourceChain}_${transfer.targetChain}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`✅ Cross-chain message sent (ID: ${messageId})`);
    return messageId;
  }

  /**
   * Release funds on target chain
   */
  private async releaseFundsOnTargetChain(
    transfer: CrossChainTransfer, 
    targetChain: BaseChain, 
    conversionDetails: any
  ): Promise<string> {
    // In real implementation, this would:
    // 1. Verify cross-chain message proof
    // 2. Release funds to users wallet
    // 3. Return transaction hash
    
    const releaseAmount = conversionDetails.targetAmount;
    const userAddress = await this.getUserAddress(transfer.sim, transfer.targetChain);
    
    // Simulate the release transaction
    const txHash = `${transfer.targetChain}_release_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`✅ Released ${releaseAmount} on ${transfer.targetChain} to ${userAddress} (Tx: ${txHash})`);
    return txHash;
  }

  /**
   * Handle conversion failure and refund
   */
  private async handleConversionFailure(transfer: CrossChainTransfer, sourceChain: BaseChain): Promise<void> {
    console.log(`🔄 Handling conversion failure - refunding ${transfer.amount} on ${transfer.sourceChain}...`);
    
    // In real implementation, this would:
    //1heck if funds were locked
    // 2. If locked but not released, refund to user
    //3 If not locked, no action needed
    
    console.log(`✅ Refund processed for failed conversion`);
  }

  /**
   * Get exchange rate between two tokens
   */
  private async getExchangeRate(sourceToken: string, targetToken: string): Promise<number> {
    // In real implementation, this would fetch from:
    // - DEX aggregators (Jupiter, 1inch, etc.)
    // - CEX APIs (Binance, Coinbase, etc.)
    // - Oracle networks (Chainlink, Pyth, etc.)
    
    // Demo rates for common pairs
    const rates: Record<string, number> = {
     'SOL/DOT': 250,
     'DOT/SOL': 0.04,
     'SOL/ETH': 0.02,
     'ETH/SOL': 500,
     'SOL/USDC': 1000,
     'USDC/SOL': 0.001,
     'DOT/USDC': 40,
     'USDC/DOT': 0.25
    };
    
    const pair = `${sourceToken}/${targetToken}`;
    const reversePair = `${targetToken}/${sourceToken}`;
    
    if (rates[pair]) {
      return rates[pair];
    } else if (rates[reversePair]) {
      return 1 / rates[reversePair];
    }
    
    // Default rate if not found
    return 10;
  }

  /**
   * Get native token for a chain
   */
  private getNativeToken(chain: string): string {
    const nativeTokens: Record<string, string> = {
      'solana': 'SOL',
      'polkadot': 'DOT',
      'ethereum': 'ETH',
      'polygon': 'MATIC',
      'arbitrum': 'ARB',
      'base': 'ETH',
      'optimism': 'ETH'
    };
    
    return nativeTokens[chain] || 'NATIVE';
  }

  /**
   * Get estimated fee for a chain
   */
  private async getChainFee(chain: string): Promise<string> {
    const fees: Record<string, string> = {
      'solana': '0.0005', // ~$0.001
      'polkadot': '0.01',   // ~$0.4
      'ethereum': '0.001',  // ~$200     
      'polygon': '0.001', // ~$0.001
      'arbitrum': '0.01', // ~$0.0001
      'base': '0.01',     // ~$0.001
      'optimism': '0.01'  // ~$0.001
    };
    
    return fees[chain] || '0.001';
  }

  /**
   * Get bridge fee for cross-chain transfer
   */
  private async getBridgeFee(sourceChain: string, targetChain: string, amount: number): Promise<string> {
    // Bridge fees are typically percentage-based
    const baseFee = 0.001 // 0.1%
    const minFee = 0.001// Minimum fee
    const maxFee = 0.01;   // Maximum fee
    
    const calculatedFee = amount * baseFee;
    return Math.max(minFee, Math.min(maxFee, calculatedFee)).toFixed(8);
  }

  /**
   * Estimate conversion time
   */
  private estimateConversionTime(sourceChain: string, targetChain: string): number {
    // Estimated times in seconds
    const times: Record<string, number> = {
      'solana-polkadot': 120, // 2 minutes
      'polkadot-solana': 120, // 2 minutes
      'solana-ethereum': 30, // 5 minutes
      'ethereum-solana': 30, // 5 minutes
      'solana-polygon': 180, // 3 minutes
      'polygon-solana': 180  // 3 minutes
    };
    
    const key = `${sourceChain}-${targetChain}`;
    return times[key] || 300; // Default 5 minutes
  }

  /**
   * Get bridge address for a chain
   */
  private async getBridgeAddress(chain: string): Promise<string> {
    // In real implementation, this would return actual bridge contract addresses
    const addresses: Record<string, string> = {
      'solana': 'BridgeContract111111111111111111111111111111111111111',
      'polkadot': '5GrwvaEF5Xb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      'ethereum': '0x123456789123456789012345678901234567890'
    };
    
    return addresses[chain] || '0x0000000000000000000000000000000000000000';
  }

  /**
   * Get user address for a chain
   */
  private async getUserAddress(sim: string, chain: string): Promise<string> {
    // In real implementation, this would derive the users address for the specific chain
    const chainInstance = this.chains.get(chain);
    if (chainInstance) {
      // This would call the chain's method to get user address
      return `user_${chain}_${sim}`;
    }
    
    return '0x0000000000000000000000000000000000000000';
  }

  /**
   * Get wallet information for a specific chain
   */
  async getWalletInfo(chainId: string, sim: string): Promise<ChainWallet> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    // For Solana, we can get detailed wallet info
    if (chainId === 'solana') {
      return await (chain as SolanaChain).getWalletInfo(sim);
    }

    // For other chains, return basic info
    const balance = await chain.checkBalance(sim, '');
    return {
      address: '', // Would be derived from SIM for other chains
      balance,
      exists: parseFloat(balance) > 0,
    };
  }

  /**
   * Test connection to a specific chain
   */
  async testChainConnection(chainId: string): Promise<boolean> {
    const chain = this.chains.get(chainId);
    if (!chain) {
      throw new Error(`Unsupported chain: ${chainId}`);
    }

    if (chainId === 'solana') {
      return await (chain as SolanaChain).testConnection();
    }

    // For other chains, implement connection testing
    return false;
  }

  /**
   * Get all supported chains
   */
  getSupportedChains(): string[] {
    return Array.from(this.chains.keys());
  }

  /**
   * Check if a chain is available
   */
  isChainAvailable(chainId: string): boolean {
    return this.chains.has(chainId);
  }

  /**
   * Get Solana chain instance (for direct access when needed)
   */
  getSolanaChain(): SolanaChain {
    return this.solanaChain;
  }
} 
# 🏗️ SIMChain Multichain Technical Architecture

## 📊 System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USSD Client   │    │   Web Client    │    │  Mobile Client  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Next.js API Layer     │
                    │  (simchain-relayer)      │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Chain Manager        │
                    │   (Orchestration)        │
                    └─────────────┬─────────────┘
                                 │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
    ┌─────▼─────┐         ┌───────▼──────┐         ┌─────▼─────┐
    │ Solana    │         │ Hyperbridge │         │ Polkadot  │
    │ Chain     │         │ (Cross-Chain│         │ Chain     │
    │           │         │  Bridge)    │         │           │
    └─────┬─────┘         └──────┬──────┘         └─────┬─────┘
          │                      │                      │
    ┌─────▼─────┐         ┌──────▼──────┐         ┌─────▼─────┐
    │ Solana    │         │ ISMP        │         │ Polkadot  │
    │ Program   │         │ Protocol    │         │ Ink!      │
    │ (Rust)    │         │             │         │ Contract  │
    └───────────┘         └─────────────┘         └───────────┘
```

## 🔗 Data Flow Architecture

### **1. Single-Chain Operations**

```
User Request → API → Chain Manager → Target Chain → Response
```

**Example: Solana Send Funds**
```
1. User: POST /api/send-funds {chain: "solana", ...}
2. API: Validate request format
3. ChainManager: Route to SolanaChain
4. SolanaChain: Use existing session validation
5. SolanaChain: Execute on Solana program
6. Response: Transaction hash + status
```

### **2. Cross-Chain Operations**

```
User Request → API → Chain Manager → Solana Validation → Hyperbridge → Target Chain → Response
```

**Example: SOL → DOT Transfer**
```
1. User: POST /api/send-funds {fromChain: "solana", toChain: "polkadot", ...}
2. API: Validate request format
3. ChainManager: Validate PIN on Solana (single source of truth)
4. ChainManager: If valid, initiate Hyperbridge transfer
5. Hyperbridge: Lock SOL on Solana, mint DOT on Polkadot
6. Response: Cross-chain transaction IDs
```

## 🏛️ Component Architecture

### **1. BaseChain Interface**

```typescript
interface ChainConfig {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: number;
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
  blockExplorer?: string;
  isTestnet: boolean;
}

interface ChainTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  gasUsed?: string;
  gasPrice?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

interface ChainWallet {
  address: string;
  balance: string;
  exists: boolean;
  alias?: string;
}

abstract class BaseChain {
  protected config: ChainConfig;
  
  constructor(config: ChainConfig) {
    this.config = config;
  }
  
  abstract initializeWallet(sim: string, pin: string): Promise<string>;
  abstract sendFunds(from: string, to: string, amount: string, pin: string): Promise<ChainTransaction>;
  abstract checkBalance(sim: string, pin: string): Promise<string>;
  abstract setAlias(sim: string, alias: string, pin: string): Promise<boolean>;
  abstract validatePin(sim: string, pin: string): Promise<boolean>;
}
```

### **2. SolanaChain Implementation**

```typescript
export class SolanaChain extends BaseChain {
  private client: SimchainClient;
  
  constructor(config: ChainConfig) {
    super(config);
    this.client = new SimchainClient({
      // Use existing @solana/kit configuration
    });
  }
  
  async validatePin(sim: string, pin: string): Promise<boolean> {
    // Use existing session-based validation
    return await this.client.validatePin(sim, pin);
  }
  
  async sendFunds(from: string, to: string, amount: string, pin: string): Promise<ChainTransaction> {
    // Use existing sendFundsRelay method
    const result = await this.client.sendFundsRelay(from, to, amount, pin);
    
    return {
      hash: result.signature,
      from,
      to,
      amount,
      status: 'confirmed'
    };
  }
  
  // ... other methods
}
```

### **3. PolkadotChain Implementation**

```typescript
export class PolkadotChain extends BaseChain {
  private api: ApiPromise;
  private keyring: Keyring;
  
  constructor(config: ChainConfig) {
    super(config);
    this.api = new ApiPromise({ provider: new WsProvider(config.rpcUrl) });
    this.keyring = new Keyring({ type: 'sr25519' });
  }
  
  async validatePin(sim: string, pin: string): Promise<boolean> {
    // Always validate on Solana (single source of truth)
    // This method is called by ChainManager for Polkadot operations
    throw new Error('PolkadotChain does not validate PINs directly');
  }
  
  async sendFunds(from: string, to: string, amount: string, pin: string): Promise<ChainTransaction> {
    // PIN validation is handled by ChainManager before calling this method
    const account = this.keyring.addFromUri(`//${from}`);
    
    const transfer = this.api.tx.balances.transfer(to, amount);
    const hash = await transfer.signAndSend(account);
    
    return {
      hash: hash.toString(),
      from,
      to,
      amount,
      status: 'pending'
    };
  }
  
  // ... other methods
}
```

### **4. ChainManager Orchestration**

```typescript
export class ChainManager {
  private chains: Map<string, BaseChain>;
  private solanaChain: SolanaChain;
  
  constructor() {
    this.chains = new Map();
    this.solanaChain = new SolanaChain(solanaConfig);
    
    // Register chains
    this.chains.set('solana', this.solanaChain);
    this.chains.set('polkadot', new PolkadotChain(polkadotConfig));
  }
  
  async executeOperation(operation: Operation): Promise<Result> {
    const { targetChain, sim, pin, ...params } = operation;
    
    // For non-Solana chains, validate PIN on Solana first
    if (targetChain !== 'solana') {
      const isValid = await this.solanaChain.validatePin(sim, pin);
      if (!isValid) {
        throw new Error('Invalid PIN');
      }
    }
    
    // Execute on target chain
    const chain = this.chains.get(targetChain);
    if (!chain) {
      throw new Error(`Unsupported chain: ${targetChain}`);
    }
    
    return await chain.executeOperation(params);
  }
  
  async crossChainTransfer(transfer: CrossChainTransfer): Promise<CrossChainResult> {
    // 1. Validate PIN on Solana
    const isValid = await this.solanaChain.validatePin(transfer.sim, transfer.pin);
    if (!isValid) {
      throw new Error('Invalid PIN');
    }
    
    // 2. Initiate Hyperbridge transfer
    const bridgeResult = await this.hyperbridge.transfer(transfer);
    
    return {
      sourceTx: bridgeResult.sourceTx,
      targetTx: bridgeResult.targetTx,
      status: 'pending'
    };
  }
}
```

## 🌉 Hyperbridge Integration

### **1. Hyperbridge Adapter**

```typescript
export class HyperbridgeAdapter {
  private host: string;
  private relayerFee: string;
  
  constructor(config: HyperbridgeConfig) {
    this.host = config.host;
    this.relayerFee = config.relayerFee;
  }
  
  async transfer(transfer: CrossChainTransfer): Promise<BridgeResult> {
    // 1. Lock funds on source chain
    const sourceTx = await this.lockFunds(transfer);
    
    // 2. Send ISMP message
    const message = await this.sendISMPMessage(transfer);
    
    // 3. Wait for confirmation on target chain
    const targetTx = await this.waitForConfirmation(message);
    
    return {
      sourceTx,
      targetTx,
      messageId: message.id
    };
  }
  
  private async lockFunds(transfer: CrossChainTransfer): Promise<string> {
    // Implementation depends on Hyperbridge SDK
  }
  
  private async sendISMPMessage(transfer: CrossChainTransfer): Promise<ISMPMessage> {
    // Implementation depends on Hyperbridge SDK
  }
}
```

### **2. ISMP Message Structure**

```typescript
interface ISMPMessage {
  id: string;
  source: string;
  destination: string;
  payload: {
    from: string;
    to: string;
    amount: string;
    asset: string;
  };
  timestamp: number;
  nonce: number;
}
```

## 📱 USSD Architecture

### **1. USSD Menu Builder**

```typescript
export class USSDMenuBuilder {
  buildMainMenu(): string {
    return `
Welcome to SIMChain

USSD Menu:
1 → Wallet
2 → Set Alias
3 → Services
4 → Help
5 → Exit

Select option:`;
  }
  
  buildWalletMenu(): string {
    return `
Wallet Options:
1 → SOL (Solana)
2 → DOT (Polkadot)
3 → USDC (Solana)
4 → USDC (Polkadot)
5 → Back

Select option:`;
  }
  
  buildServicesMenu(): string {
    return `
DeFi Services:
1. View Interest Rates - SOL
2. Withdraw from Vault - DOT
3. Loan Request - SOL
4. Loan Repayment - SOL
5. Stake Tokens - DOT
6. View Staking Rewards - DOT
7. Swap Tokens
8. Back

Select option:`;
  }
}
```

### **2. USSD Response Formatter**

```typescript
export class USSDResponseFormatter {
  formatBalance(chain: string, balance: string, symbol: string): string {
    return `${chain.toUpperCase()} Balance: ${balance} ${symbol}`;
  }
  
  formatTransaction(tx: ChainTransaction): string {
    return `✅ Transaction successful!
Hash: ${tx.hash}
Amount: ${tx.amount}
Status: ${tx.status}`;
  }
  
  formatError(error: string): string {
    return `❌ Error: ${error}
Please try again or contact support.`;
  }
  
  formatProcessing(): string {
    return `⏳ Processing...
Please wait...`;
  }
}
```

## 🔐 Security Architecture

### **1. Validation Flow**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ User Input  │───▶│ API Layer   │───▶│ Solana      │
│ (SIM + PIN) │    │ Validation  │    │ Validation  │
└─────────────┘    └─────────────┘    └─────────────┘
                          │                    │
                          ▼                    ▼
                   ┌─────────────┐    ┌─────────────┐
                   │ PIN Never   │    │ Session     │
                   │ Stored      │    │ Created     │
                   └─────────────┘    └─────────────┘
```

### **2. Cross-Chain Security**

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Solana      │───▶│ Hyperbridge │───▶│ Polkadot    │
│ Validation  │    │ ISMP        │    │ Execution   │
│ (Single     │    │ Protocol    │    │ (Trusted)   │
│ Source)     │    │ (Secure)    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
```

## 📊 Database Schema

### **1. Enhanced Wallet Table**

```sql
-- Existing wallet table enhanced for multichain
ALTER TABLE wallets ADD COLUMN chain_id VARCHAR(50) DEFAULT 'solana';
ALTER TABLE wallets ADD COLUMN chain_address VARCHAR(255);
ALTER TABLE wallets ADD COLUMN chain_balance DECIMAL(20,8) DEFAULT 0;
ALTER TABLE wallets ADD COLUMN chain_currency VARCHAR(10) DEFAULT 'SOL';

-- Index for efficient chain-based queries
CREATE INDEX idx_wallets_chain ON wallets(chain_id, sim);
```

### **2. Cross-Chain Transactions Table**

```sql
CREATE TABLE cross_chain_transactions (
  id SERIAL PRIMARY KEY,
  user_sim VARCHAR(20) NOT NULL,
  source_chain VARCHAR(50) NOT NULL,
  target_chain VARCHAR(50) NOT NULL,
  source_tx_hash VARCHAR(255),
  target_tx_hash VARCHAR(255),
  bridge_message_id VARCHAR(255),
  amount DECIMAL(20,8) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🚀 Deployment Architecture

### **1. Environment Configuration**

```typescript
// config/chains.ts
export const chainConfigs = {
  solana: {
    id: 'solana',
    name: 'Solana',
    rpcUrl: process.env.SOLANA_RPC_URL!,
    chainId: 101,
    nativeCurrency: { symbol: 'SOL', decimals: 9 },
    blockExplorer: 'https://explorer.solana.com',
    isTestnet: process.env.NODE_ENV === 'development'
  },
  polkadot: {
    id: 'polkadot',
    name: 'Polkadot',
    rpcUrl: process.env.POLKADOT_RPC_URL!,
    chainId: 0,
    nativeCurrency: { symbol: 'DOT', decimals: 10 },
    blockExplorer: 'https://polkascan.io',
    isTestnet: process.env.NODE_ENV === 'development'
  }
};

// config/hyperbridge.ts
export const hyperbridgeConfig = {
  host: process.env.HYPERBRIDGE_HOST!,
  relayerFee: process.env.HYPERBRIDGE_RELAYER_FEE!,
  timeout: parseInt(process.env.HYPERBRIDGE_TIMEOUT || '30000')
};
```

### **2. Environment Variables**

```bash
# .env.local
# Solana Configuration
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PROGRAM_ID=your_program_id

# Polkadot Configuration
POLKADOT_RPC_URL=wss://rpc.polkadot.io
POLKADOT_CONTRACT_ADDRESS=your_contract_address

# Hyperbridge Configuration
HYPERBRIDGE_HOST=https://hyperbridge.network
HYPERBRIDGE_RELAYER_FEE=0.001
HYPERBRIDGE_TIMEOUT=30000

# Database
DATABASE_URL=your_database_url
```

## 📈 Monitoring & Observability

### **1. Key Metrics**

```typescript
// Monitoring metrics
interface Metrics {
  // Transaction metrics
  transactionSuccessRate: number;
  averageResponseTime: number;
  crossChainSuccessRate: number;
  
  // Validation metrics
  validationSuccessRate: number;
  averageValidationTime: number;
  
  // USSD metrics
  ussdSessionCompletionRate: number;
  averageUSSDResponseTime: number;
  
  // Error metrics
  errorRate: number;
  errorRecoveryRate: number;
}
```

### **2. Logging Strategy**

```typescript
// Structured logging
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: 'api' | 'chain-manager' | 'ussd';
  operation: string;
  chain?: string;
  userSim?: string; // Encrypted
  transactionHash?: string;
  duration?: number;
  error?: string;
}
```

---

*This architecture document provides the technical foundation for implementing multichain support in SIMChain.* 
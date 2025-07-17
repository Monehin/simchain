# SIMChain Multichain Implementation

## Overview

The SIMChain multichain implementation provides a unified interface for interacting with multiple blockchain networks while maintaining Solana as the single source of truth for PIN validation. This implementation supports Solana and Polkadot chains, with a hybrid validation model that ensures security and consistency across all supported networks.

## Architecture

### Core Components

1. **BaseChain Interface** (`src/lib/chains/base-chain.ts`)
   - Defines the common interface for all blockchain implementations
   - Ensures consistent API across different chains
   - Supports wallet operations, balance checks, and PIN validation

2. **SolanaChain** (`src/lib/chains/solana-chain.ts`)
   - Primary chain implementation using Solana
   - Handles PIN validation and wallet management
   - Serves as the single source of truth for user authentication

3. **PolkadotChain** (`src/lib/chains/polkadot-chain.ts`)
   - Polkadot implementation using @polkadot/api
   - Delegates PIN validation to SolanaChain
   - Supports Polkadot-specific operations

4. **ChainManager** (`src/lib/chains/chain-manager.ts`)
   - Orchestrates operations across multiple chains
   - Enforces hybrid validation model
   - Provides unified API for chain operations

5. **Chain Configurations** (`src/config/chains.ts`)
   - Centralized configuration for all supported chains
   - Easy addition of new chains
   - Environment-specific settings

### Hybrid Validation Model

The implementation uses a hybrid validation approach where:

- **Solana acts as the single source of truth** for PIN validation
- **Non-Solana chains delegate PIN validation** to Solana before executing operations
- **All chains maintain their own wallet state** but share authentication
- **Cross-chain operations** are validated through Solana first

## Supported Chains

### Solana
- **RPC URL**: Configurable via environment variables
- **Program ID**: SIMChain wallet program
- **Features**: Full wallet management, PIN validation, transaction processing

### Polkadot
- **RPC URL**: wss://rpc.polkadot.io (configurable)
- **Features**: Balance checking, fund transfers, wallet initialization
- **PIN Validation**: Delegated to Solana

## API Usage

### Relay API Endpoints

All relay API endpoints now support a `chain` parameter to specify the target blockchain:

```typescript
// Example: Check balance on Polkadot
POST /api/relay
{
  "action": "wallet-balance",
  "chain": "polkadot",
  "sim": "+1234567890"
}

// Example: Send funds on Solana (default)
POST /api/relay
{
  "action": "send-funds",
  "chain": "solana", // or omit for default
  "fromSim": "+1234567890",
  "toSim": "+0987654321",
  "amount": 1000000,
  "pin": "123456"
}
```

### Supported Actions

- `wallet-info` - Get wallet information
- `wallet-balance` - Check wallet balance
- `health-check` - Test chain connection
- `initialize-wallet` - Create new wallet
- `verify-pin` - Validate PIN
- `set-alias` - Set wallet alias
- `send-funds` - Transfer funds
- `deposit-funds` - Deposit funds to wallet

## Chain Manager Operations

### Basic Operations

```typescript
import { ChainManager } from './lib/chains/chain-manager';

const chainManager = new ChainManager();

// Execute operation on specific chain
const balance = await chainManager.executeOperation({
  type: 'checkBalance',
  targetChain: 'polkadot',
  sim: '+1234567890',
  pin: '123456',
  params: {}
});

// Get wallet info
const walletInfo = await chainManager.getWalletInfo('solana', '+1234567890');

// Test chain connection
const isConnected = await chainManager.testChainConnection('polkadot');
```

### Cross-Chain Transfers (Future)

```typescript
// Placeholder for Hyperbridge integration
const result = await chainManager.crossChainTransfer({
  sim: '+1234567890',
  pin: '123456',
  sourceChain: 'solana',
  targetChain: 'polkadot',
  amount: '1000000'
});
```

## Configuration

### Environment Variables

```bash
# Solana Configuration
SOLANA_CLUSTER_URL=http://127.0.0.1:8899
WALLET_PRIVATE_KEY=[base58-encoded-private-key]

# Polkadot Configuration
POLKADOT_RPC_URL=wss://rpc.polkadot.io

# Chain Support
ENABLE_POLKADOT=true
ENABLE_ETHEREUM=false
ENABLE_POLYGON=false
```

### Chain Configuration

```typescript
// src/config/chains.ts
export const chainConfigs = {
  solana: {
    id: 'solana',
    name: 'Solana',
    rpcUrl: process.env.SOLANA_CLUSTER_URL || 'http://127.0.0.1:8899',
    chainId: 101,
    nativeCurrency: { symbol: 'SOL', decimals: 9 },
    blockExplorer: 'https://explorer.solana.com',
    isTestnet: process.env.NODE_ENV === 'development'
  },
  polkadot: {
    id: 'polkadot',
    name: 'Polkadot',
    rpcUrl: process.env.POLKADOT_RPC_URL || 'wss://rpc.polkadot.io',
    chainId: 0,
    nativeCurrency: { symbol: 'DOT', decimals: 10 },
    blockExplorer: 'https://polkascan.io',
    isTestnet: false
  }
};
```

## Testing

### Test Structure

```
src/lib/chains/__tests__/
├── polkadot-chain.test.ts    # PolkadotChain unit tests
├── chain-manager.test.ts     # ChainManager integration tests
└── relay.test.ts             # Relay API tests
```

### Running Tests

```bash
# Run all multichain tests
npm test -- --testPathPattern="chains|relay"

# Run specific test file
npm test -- src/lib/chains/__tests__/polkadot-chain.test.ts

# Run with coverage
npm test -- --coverage --testPathPattern="chains|relay"
```

### Test Coverage

- **PolkadotChain**: PIN validation delegation, API operations, error handling
- **ChainManager**: Chain orchestration, hybrid validation, operation routing
- **Relay API**: Multichain endpoint support, parameter handling, error responses

## Security Considerations

### PIN Validation
- PINs are never stored on any chain
- Solana serves as the single source of truth for PIN validation
- Non-Solana chains validate PINs through Solana before operations
- PIN validation is required for all sensitive operations

### Cross-Chain Security
- All cross-chain operations validate PINs on Solana first
- Chain-specific operations maintain their own security models
- Future Hyperbridge integration will add additional security layers

### Error Handling
- Comprehensive error handling across all chain operations
- Graceful degradation when chains are unavailable
- Detailed error messages for debugging

## Future Enhancements

### Planned Features
1. **Ethereum Support**: Add Ethereum chain implementation
2. **Polygon Support**: Add Polygon chain implementation
3. **Hyperbridge Integration**: Enable true cross-chain transfers
4. **Chain-Specific Features**: DeFi operations, staking, etc.

### Hyperbridge Integration
- Cross-chain message passing
- Atomic cross-chain transfers
- Bridge security and validation
- Gas fee optimization

### Performance Optimizations
- Connection pooling for RPC endpoints
- Caching for frequently accessed data
- Batch operations for multiple chains
- Async operation optimization

## Dependencies

### Core Dependencies
```json
{
  "@solana/web3.js": "^1.87.0",
  "@polkadot/api": "^16.4.1",
  "@polkadot/keyring": "^13.5.3",
  "@polkadot/util": "^13.5.3",
  "@polkadot/util-crypto": "^13.5.3"
}
```

### Development Dependencies
```json
{
  "jest": "^29.7.0",
  "@types/jest": "^29.5.0"
}
```

## Troubleshooting

### Common Issues

1. **Polkadot Connection Failures**
   - Check RPC URL configuration
   - Verify network connectivity
   - Ensure Polkadot node is accessible

2. **PIN Validation Errors**
   - Verify Solana chain is operational
   - Check PIN format and length
   - Ensure wallet exists on Solana

3. **Chain Manager Errors**
   - Verify chain configurations
   - Check environment variables
   - Ensure all required dependencies are installed

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=simchain:chains
```

This will provide detailed logging for chain operations and debugging information.

## Contributing

When adding new chains:

1. Implement the `BaseChain` interface
2. Add chain configuration to `chains.ts`
3. Update `ChainManager` constructor
4. Add comprehensive tests
5. Update documentation

Follow the existing patterns for consistency and maintainability. 
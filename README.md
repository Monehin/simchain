# SIMChain - Solana Smart Contract Wallets for SIM Numbers

SIMChain is a full-stack Solana project that creates smart contract wallets tied to SIM numbers, enabling mobile money transfers through USSD gateways.

## 🏗️ Architecture

- **Smart Contract**: Solana program written in Rust using Anchor framework
- **TypeScript Client**: Reusable SDK for interacting with SIM wallets
- **USSD Gateway**: Off-chain service for mobile money operations
- **Relayer Node**: Transaction submission and monitoring

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.87.0+
- Solana CLI 1.17+
- Anchor CLI 0.31.1+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd SIMChain

# Install dependencies
yarn install

# Build the program
anchor build

# Run tests
anchor test
```

## 🔧 Environment Configuration

SIMChain uses environment variables for configuration. Before running the application, you need to set up your environment variables.

### 1. Copy Environment Template

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your actual values
nano .env
```

### 2. Required Environment Variables

#### Development Environment
```bash
# Solana Configuration
SOLANA_CLUSTER_URL=http://127.0.0.1:8899
PROGRAM_ID=7QPKWcBGt8J7UJkiFyezv6RcoNdfwy1aAatbx6W2F21a

# Security Configuration
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here

# Logging Configuration
LOG_LEVEL=info
PORT=3000
NODE_ENV=development
```

#### Production Environment
```bash
# All development variables plus:
AT_API_KEY=your_africastalking_api_key_here
AT_USERNAME=your_africastalking_username_here
AT_SENDER_ID=your_sender_id_here
DATABASE_URL=postgresql://username:password@localhost:5432/simchain
REDIS_URL=redis://localhost:6379
LOG_FILE=./logs/simchain.log
```

### 3. Validate Environment Configuration

```bash
# Validate environment variables
yarn validate:env

# Or test environment configuration
yarn test:env
```

The validation will check for required environment variables and provide clear error messages if any are missing.

## 📱 TypeScript Client Usage

The SIMChain client provides a comprehensive SDK for interacting with SIM wallets.

### Basic Setup

```typescript
import { SimchainClient } from "./client/simchainClient";
import { Connection, Keypair } from "@solana/web3.js";

// Create connection
const connection = new Connection("http://localhost:8899", "confirmed");

// Load or generate wallet
const wallet = Keypair.generate();

// Initialize client
const client = new SimchainClient({
  connection,
  wallet,
  programId: new PublicKey("your_program_id_here"),
  commitment: "confirmed"
});
```

### Core Operations

#### 1. Initialize Wallet

```typescript
// Create a new wallet for a SIM number
const simNumber = "2348012345678";
const pin = "1234";

const signature = await client.initializeWallet(simNumber, pin);
console.log("Wallet created:", signature);
```

#### 2. Add Funds

```typescript
// Add funds to a wallet
const amount = 1.5; // 1.5 SOL
const signature = await client.addFunds(simNumber, amount);
console.log("Funds added:", signature);
```

#### 3. Check Balance

```typescript
// Get wallet balance
const balance = await client.checkBalance(simNumber);
console.log(`Balance: ${balance} SOL`);
```

#### 4. Send Funds

```typescript
// Send funds between wallets
const fromSim = "2348012345678";
const toSim = "2348098765432";
const amount = 0.5; // 0.5 SOL

const signature = await client.send(fromSim, toSim, amount);
console.log("Transfer completed:", signature);
```

#### 5. Get Wallet Information

```typescript
// Get complete wallet details
const [walletPda] = client.deriveWalletPDA(simNumber);
const walletInfo = await client.program.account.wallet.fetch(walletPda);
if (walletInfo) {
  console.log("Owner:", walletInfo.owner.toString());
  console.log("Balance:", walletInfo.balance, "SOL");
  console.log("Bump:", walletInfo.bump);
}
```

#### 6. Check Wallet Existence

```typescript
// Check if a wallet exists
const [walletPda] = client.deriveWalletPDA(simNumber);
try {
  await client.program.account.wallet.fetch(walletPda);
  console.log("Wallet exists: true");
} catch {
  console.log("Wallet exists: false");
}
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
# Run all tests
anchor test

# Run specific test file
yarn test tests/simchain_wallet.ts

# Validate environment before testing
yarn validate:env
```

Run the example usage:

```bash
# Start local validator
solana-test-validator

# In another terminal, run the example
yarn ts-node examples/basic-usage.ts
```

## 📋 Smart Contract Instructions

### `initialize_wallet`
Creates a new wallet for a SIM number.

**Parameters:**
- `sim_number`: String (10-15 characters)
- `pin_hash`: 32-byte array (SHA-256 hash of PIN)

**Accounts:**
- `wallet`: PDA derived from SIM number
- `authority`: Signer paying for account creation
- `system_program`: System program

### `add_funds`
Adds funds to a wallet (for testing and initial funding).

**Parameters:**
- `amount`: f64 (amount in SOL)

**Accounts:**
- `wallet`: PDA of the wallet
- `authority`: Signer (wallet owner)

### `check_balance`
Logs the current balance of a wallet.

**Parameters:** None

**Accounts:**
- `wallet`: PDA of the wallet

### `send`
Transfers funds between two wallets.

**Parameters:**
- `amount`: f64 (amount in SOL)

**Accounts:**
- `sender_wallet`: PDA of sender wallet
- `receiver_wallet`: PDA of receiver wallet
- `owner`: Signer (sender wallet owner)

## 🔧 Development

### Project Structure

```
SIMChain/
├── programs/
│   └── simchain_wallet/     # Rust smart contract
├── client/
│   └── simchainClient.ts    # TypeScript client SDK
├── utils/
│   ├── env.ts              # Environment validation
│   └── startup.ts          # Startup validation
├── scripts/
│   └── validate-env.ts     # Environment validation script
├── tests/
│   └── simchain_wallet.ts   # Integration tests
├── examples/
│   └── basic-usage.ts       # Usage examples
├── env.example             # Environment template
└── scripts/
    └── deploy.sh           # Deployment script
```

### Building

```bash
# Build the program
anchor build

# Deploy to localnet
anchor deploy

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

### Testing

```bash
# Run tests with local validator
anchor test

# Run tests on devnet
anchor test --provider.cluster devnet

# Validate environment
yarn validate:env
```

## 📊 Account Structure

### Wallet Account

```rust
pub struct wallet {
    pub sim_number: String,    // SIM number (10-15 chars)
    pub balance: f64,          // Balance in SOL
    pub owner: Pubkey,         // Wallet owner
    pub pin_hash: [u8; 32],    // Hashed PIN
    pub bump: u8,              // PDA bump
}
```

## 🔐 Security Features

- **PIN Protection**: All operations require PIN verification
- **Owner Authorization**: Only wallet owner can send funds
- **SIM Validation**: SIM numbers must be 10-15 characters
- **Amount Validation**: All amounts must be positive
- **Balance Checks**: Prevents insufficient balance transfers
- **Environment Validation**: Early validation of required environment variables

## 🚀 Deployment

### Local Development

```bash
# Start local validator
solana-test-validator

# Deploy program
anchor deploy

# Run tests
anchor test

# Validate environment
yarn validate:env
```

### Devnet Deployment

```bash
# Set cluster to devnet
solana config set --url devnet

# Deploy program
anchor deploy --provider.cluster devnet

# Test on devnet
anchor test --provider.cluster devnet
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue on GitHub. 
# SIMChain Testing Guide

## Quick Test Commands

### Run Full Test Suite (Recommended)
```bash
yarn test:full
```
This command:
- Cleans up any existing validators
- Starts a fresh validator
- Builds and deploys the program
- Runs all tests with proper environment variables
- Cleans up after completion

### Run Tests Only (Validator must be running)
```bash
yarn test
```
Requires:
- Validator running on port 8899
- Program deployed
- Environment variables set

### Manual Test Setup
```bash
# 1. Clean up
yarn clean

# 2. Start validator
solana-test-validator --reset &

# 3. Build and deploy
anchor build && anchor deploy

# 4. Run tests
ANCHOR_WALLET=/Users/monehin/.config/solana/id.json \
PROGRAM_ID=DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r \
ANCHOR_PROVIDER_URL=http://127.0.0.1:8899 \
SOLANA_CLUSTER_URL=http://127.0.0.1:8899 \
yarn test
```

## Environment Variables

Required for tests:
- `ANCHOR_WALLET`: Path to Solana wallet keypair
- `PROGRAM_ID`: Deployed program ID
- `ANCHOR_PROVIDER_URL`: Validator RPC URL
- `SOLANA_CLUSTER_URL`: Validator RPC URL

## Test Structure

- **Native SOL Flows**: Deposit, withdraw, send SOL between wallets
- **SPL-Token Flows**: SIM and USDC token transfers
- **Config & Admin Flows**: Salt rotation, admin transfer, account closure
- **Rent-Exemption Guards**: Tests for proper rent management 
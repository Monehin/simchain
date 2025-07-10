#!/bin/bash

# SIMChain Test Runner
# This script runs the complete test suite with proper environment setup

set -e

echo "🧪 SIMChain Test Runner"
echo "========================"

# Step 1: Clean up any existing validators
echo "1️⃣ Cleaning up existing validators..."
pkill -f "solana-test-validator" || true
sleep 2
rm -rf test-ledger || true

# Step 2: Start fresh validator
echo "2️⃣ Starting fresh validator..."
solana-test-validator --reset &
VALIDATOR_PID=$!
sleep 5

# Step 3: Build and deploy
echo "3️⃣ Building and deploying program..."
anchor build
anchor deploy

# Step 4: Run tests with proper environment variables
echo "4️⃣ Running tests..."
ANCHOR_WALLET=/Users/monehin/.config/solana/id.json \
PROGRAM_ID=DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r \
ANCHOR_PROVIDER_URL=http://127.0.0.1:8899 \
SOLANA_CLUSTER_URL=http://127.0.0.1:8899 \
yarn test

# Step 5: Cleanup
echo "5️⃣ Cleaning up..."
kill $VALIDATOR_PID || true
rm -rf test-ledger || true

echo "✅ Test run completed!" 
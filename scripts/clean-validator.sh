#!/bin/bash

echo "🧹 Cleaning up validators and test ledger..."

# Kill any existing validators
pkill -f "solana-test-validator" || true
sleep 2

# Remove test ledger
rm -rf test-ledger || true

echo "✅ Cleanup complete!" 
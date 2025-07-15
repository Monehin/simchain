#!/bin/bash

echo "🧹 Cleaning up validators and test ledger..."

# Kill any existing validators
pkill -f "solana-test-validator" || true
sleep 2

# Remove test ledger with better error handling
if [ -d "test-ledger" ]; then
    echo "Removing test-ledger directory..."
    # Try normal removal first
    if ! rm -rf test-ledger 2>/dev/null; then
        echo "Permission denied, trying with elevated privileges..."
        # Try with sudo if normal removal fails
        if ! sudo rm -rf test-ledger 2>/dev/null; then
            echo "⚠️  Warning: Could not remove test-ledger directory"
            echo "   You may need to manually remove it or check permissions"
        else
            echo "✅ test-ledger removed with elevated privileges"
        fi
    else
        echo "✅ test-ledger removed successfully"
    fi
else
    echo "ℹ️  test-ledger directory not found"
fi

echo "✅ Cleanup complete!" 
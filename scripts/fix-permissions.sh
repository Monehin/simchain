#!/bin/bash

echo "🔧 Fixing permissions for test-ledger directory..."

# Check if test-ledger exists
if [ ! -d "test-ledger" ]; then
    echo "ℹ️  test-ledger directory not found - nothing to fix"
    exit 0
fi

echo "Current permissions:"
ls -la test-ledger

echo ""
echo "Attempting to fix permissions..."

# Try to change ownership to current user
if ! sudo chown -R $(whoami) test-ledger 2>/dev/null; then
    echo "⚠️  Could not change ownership"
else
    echo "✅ Ownership changed to current user"
fi

# Try to change permissions
if ! chmod -R 755 test-ledger 2>/dev/null; then
    echo "⚠️  Could not change permissions"
else
    echo "✅ Permissions changed to 755"
fi

echo ""
echo "Updated permissions:"
ls -la test-ledger

echo ""
echo "Now try running the clean-validator script again:"
echo "  ./scripts/clean-validator.sh" 
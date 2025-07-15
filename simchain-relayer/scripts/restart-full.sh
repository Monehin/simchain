#!/bin/bash

echo "🚀 SIMChain Full Restart Script (Program + Validator + Relayer)"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_program() {
    echo -e "${PURPLE}[PROGRAM]${NC} $1"
}

# Step 1: Kill all running instances
print_status "Killing all running processes..."
pkill -f "next\|node\|npm\|yarn\|solana\|anchor" 2>/dev/null || true
sleep 3
print_success "All processes killed"

# Step 2: Check if we're in the right directory structure
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the simchain-relayer directory."
    exit 1
fi

# Check if we're in the SIMChain root
cd ..
if [ -f "Anchor.toml" ]; then
    print_success "Found SIMChain root directory with Anchor.toml"
    SIMCHAIN_ROOT=$(pwd)
    RELAYER_DIR="$SIMCHAIN_ROOT/simchain-relayer"
else
    print_error "Anchor.toml not found. Please ensure you're in the SIMChain project root."
    exit 1
fi

# Step 3: Build and deploy the Solana program
print_program "Building and deploying Solana program..."
cd "$SIMCHAIN_ROOT"

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    print_error "Anchor CLI not found. Please install it first:"
    echo "cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    exit 1
fi

# Build the program
print_program "Building program..."
anchor build
if [ $? -eq 0 ]; then
    print_success "Program built successfully"
else
    print_error "Failed to build program"
    exit 1
fi

# Deploy the program
print_program "Deploying program..."
anchor deploy
if [ $? -eq 0 ]; then
    print_success "Program deployed successfully"
else
    print_error "Failed to deploy program"
    exit 1
fi

# Step 4: Start Solana validator (optional)
read -p "Do you want to start a local Solana validator? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_program "Starting local Solana validator..."
    
    # Check if validator is already running
    if pgrep -f "solana-test-validator" > /dev/null; then
        print_warning "Validator already running, killing it first..."
        pkill -f "solana-test-validator"
        sleep 2
    fi
    
    # Start validator in background
    solana-test-validator --reset &
    VALIDATOR_PID=$!
    sleep 5
    
    if kill -0 $VALIDATOR_PID 2>/dev/null; then
        print_success "Validator started (PID: $VALIDATOR_PID)"
    else
        print_error "Failed to start validator"
        exit 1
    fi
fi

# Step 5: Setup relayer environment
cd "$RELAYER_DIR"
print_status "Setting up relayer environment..."

# Install dependencies
print_status "Installing relayer dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Check environment variables
print_status "Checking environment variables..."
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    print_warning "No .env or .env.local file found. Please ensure your environment variables are set."
else
    print_success "Environment files found"
fi

# Regenerate Prisma client
print_status "Regenerating Prisma client..."
npx prisma generate
if [ $? -eq 0 ]; then
    print_success "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Push schema to database (optional)
read -p "Do you want to push schema to database? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Pushing schema to database..."
    npx prisma db push
    if [ $? -eq 0 ]; then
        print_success "Schema pushed to database"
    else
        print_error "Failed to push schema"
        exit 1
    fi
fi

# Step 6: Initialize program (if needed)
read -p "Do you want to initialize the program? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_program "Initializing program..."
    curl -X POST http://localhost:3000/api/init-program
    if [ $? -eq 0 ]; then
        print_success "Program initialization requested"
    else
        print_warning "Program initialization failed (server might not be running yet)"
    fi
fi

# Step 7: Start the relayer development server
print_status "Starting relayer development server..."
print_warning "Server will start in the background. Check the logs for any errors."
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 8

# Step 8: Test the API endpoints
print_status "Testing API endpoints..."

# Test connection
print_status "Testing connection..."
CONNECTION_RESPONSE=$(curl -s -X GET http://localhost:3000/api/test-connection 2>/dev/null)
if [[ $CONNECTION_RESPONSE == *"success"* ]]; then
    print_success "Connection test passed"
else
    print_error "Connection test failed: $CONNECTION_RESPONSE"
fi

# Test database
print_status "Testing database..."
DATABASE_RESPONSE=$(curl -s -X GET http://localhost:3000/api/test-database 2>/dev/null)
if [[ $DATABASE_RESPONSE == *"success"* ]]; then
    print_success "Database test passed"
else
    print_error "Database test failed: $DATABASE_RESPONSE"
fi

# Step 9: Final status
echo
echo "=============================================================="
print_success "SIMChain FULL restart completed!"
echo
echo "📋 Component Status:"
if [[ $REPLY =~ ^[Yy]$ ]] && [ ! -z "$VALIDATOR_PID" ]; then
    echo "✅ Solana Validator: Running (PID: $VALIDATOR_PID)"
else
    echo "⏸️  Solana Validator: Not started (using external RPC)"
fi
echo "✅ Solana Program: Built and deployed"
echo "✅ Relayer Server: Running (PID: $SERVER_PID)"
echo
echo "🌐 Access Points:"
echo "- Relayer Admin: http://localhost:3000/admin"
echo "- USSD Simulator: http://localhost:3000/ussd"
echo "- API Base: http://localhost:3000/api"
echo
echo "🔧 Useful Commands:"
echo "- View relayer logs: tail -f .next/server.log"
echo "- Stop all: pkill -f 'next\|solana-test-validator'"
echo "- Test API: curl http://localhost:3000/api/test-connection"
echo "- Check validator: solana logs"
echo
echo "📝 Next Steps:"
echo "1. Create test wallets via API or admin interface"
echo "2. Test USSD simulator functionality"
echo "3. Verify on-chain transactions"
echo
print_status "Happy coding! 🚀" 
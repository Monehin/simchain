#!/bin/bash

# Crosschain Hyperbridge - Start All Services
# This script starts all components of the crosschain-hyperbridge project

set -e

echo "🚀 Starting Crosschain Hyperbridge Services..."
echo "=============================================="

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use. Please stop the service using that port first."
        return 1
    fi
    return 0
}

# Function to start a service in background
start_service() {
    local name=$1
    local dir=$2
    local cmd=$3
    local port=$4
    
    echo "Starting $name..."
    if [ ! -z "$port" ]; then
        if ! check_port $port; then
            return 1
        fi
    fi
    
    cd "$dir" || { echo "❌ Failed to change to directory $dir"; exit 1; }
    
    # Start the service in background
    eval "$cmd" > "$name.log" 2>&1 &
    local pid=$!
    echo $pid > "$name.pid"
    echo "✅ $name started (PID: $pid)"
    echo "📁 PID file created: $dir/$name.pid"
    
    # Verify PID file was created
    if [ -f "$name.pid" ]; then
        echo "✅ PID file verified: $name.pid"
    else
        echo "⚠️  Warning: PID file not created for $name"
    fi
    cd - > /dev/null
}

# Kill any existing processes
echo "🔄 Stopping any existing services..."
pkill -f "hardhat node" || true
pkill -f "anchor localnet" || true
pkill -f "node index.js" || true
pkill -f "react-scripts start" || true

# Wait a moment for processes to stop
sleep 2

# Start Ethereum Hardhat Node
start_service "Ethereum Hardhat Node" "eth-contract" "npx hardhat node" "8545"

# Start Solana Anchor Localnet
start_service "Solana Anchor Localnet" "solana-program" "anchor localnet" "8899"

# Install dependencies and start Relayer Script
echo "Starting Relayer Script..."
cd "relayer-script" || { echo "❌ Failed to change to relayer-script directory"; exit 1; }
npm install @hyperbridge/sdk > /dev/null 2>&1 || echo "⚠️  Failed to install @hyperbridge/sdk"
if [ -f "index.js" ]; then
    node index.js > "relayer.log" 2>&1 &
    echo $! > "relayer.pid"
    echo "✅ Relayer Script started (PID: $!)"
else
    echo "⚠️  index.js not found in relayer-script, skipping..."
fi
cd - > /dev/null

# Start React Frontend
start_service "React Frontend" "frontend" "npm start" "3000"

echo ""
echo "🎉 All services started!"
echo "========================"
echo "📱 Frontend: http://localhost:3000 (or 3001)"
echo "🔗 Ethereum: http://127.0.0.1:8545"
echo "🔗 Solana: http://127.0.0.1:8899"
echo ""
echo "📋 Log files:"
echo "  - Ethereum: eth-contract/Ethereum Hardhat Node.log"
echo "  - Solana: solana-program/Solana Anchor Localnet.log"
echo "  - Relayer: relayer-script/relayer.log"
echo "  - Frontend: frontend/React Frontend.log"
echo ""
echo "🛑 To stop all services, run: ./stop-all.sh"
echo "" 